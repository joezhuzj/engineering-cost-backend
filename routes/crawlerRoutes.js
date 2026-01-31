const express = require('express');
const router = express.Router();
const { News, User } = require('../models');
const crawlerService = require('../services/crawlerService');

/**
 * 接收本地爬虫提交的新闻
 * POST /api/crawler/submit
 * 使用密钥验证
 */
router.post('/submit', async (req, res) => {
  try {
    // 密钥验证
    const crawlerKey = req.headers['x-crawler-key'];
    const cronKey = process.env.CRON_SECRET || 'zjzj-crawler-2026';
    
    if (crawlerKey !== cronKey) {
      return res.status(403).json({
        success: false,
        message: '无效的密钥'
      });
    }
    
    const { title, category, excerpt, content, badge, status, publish_date, attachments } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '标题不能为空'
      });
    }
    
    // 检查是否已存在
    const existing = await News.findOne({ where: { title } });
    
    if (existing) {
      return res.json({
        success: true,
        action: 'skipped',
        message: '新闻已存在'
      });
    }
    
    // 获取管理员用户作为作者
    let admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) admin = { id: 1 };
    
    // 创建新闻
    const news = await News.create({
      title,
      category: category || 'industry',
      excerpt,
      content,
      badge: badge || '政策',
      status: status || 'published',
      publish_date: publish_date ? new Date(publish_date) : new Date(),
      author_id: admin.id,
      attachments: attachments || null
    });
    
    console.log(`✅ 爬虫提交新闻: ${title}`);
    
    res.json({
      success: true,
      action: 'added',
      message: '新闻已添加',
      data: { id: news.id }
    });
    
  } catch (error) {
    console.error('接收爬虫数据失败:', error);
    res.status(500).json({
      success: false,
      message: '提交失败: ' + error.message
    });
  }
});

/**
 * 删除指定的新闻（用于清理爬取数据）
 * POST /api/crawler/delete
 */
router.post('/delete', async (req, res) => {
  try {
    const crawlerKey = req.headers['x-crawler-key'];
    const cronKey = process.env.CRON_SECRET || 'zjzj-crawler-2026';
    
    if (crawlerKey !== cronKey) {
      return res.status(403).json({ success: false, message: '无效的密钥' });
    }
    
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请提供要删除的新闻ID数组' });
    }
    
    const deleted = await News.destroy({ where: { id: ids } });
    
    console.log(`🗑️ 删除了 ${deleted} 条新闻`);
    
    res.json({
      success: true,
      message: `已删除 ${deleted} 条新闻`,
      deleted: deleted
    });
    
  } catch (error) {
    console.error('删除失败:', error);
    res.status(500).json({ success: false, message: '删除失败: ' + error.message });
  }
});

/**
 * 批量检查新闻是否已存在
 * POST /api/crawler/check-exists
 */
router.post('/check-exists', async (req, res) => {
  try {
    const crawlerKey = req.headers['x-crawler-key'];
    const cronKey = process.env.CRON_SECRET || 'zjzj-crawler-2026';
    
    if (crawlerKey !== cronKey) {
      return res.status(403).json({ success: false, message: '无效的密钥' });
    }
    
    const { titles } = req.body;
    
    if (!titles || !Array.isArray(titles) || titles.length === 0) {
      return res.status(400).json({ success: false, message: '请提供标题数组' });
    }
    
    // 查询已存在的标题
    const existing = await News.findAll({
      where: { title: titles },
      attributes: ['title']
    });
    
    const existingTitles = existing.map(n => n.title);
    
    res.json({
      success: true,
      existingTitles: existingTitles
    });
    
  } catch (error) {
    console.error('检查失败:', error);
    res.status(500).json({ success: false, message: '检查失败: ' + error.message });
  }
});

/**
 * 触发爬取浙江造价网新闻
 * POST /api/crawler/sync
 * 使用密钥验证
 */
router.post('/sync', async (req, res) => {
  try {
    // 密钥验证
    const crawlerKey = req.headers['x-crawler-key'];
    const cronKey = process.env.CRON_SECRET || 'zjzj-crawler-2026';
    
    if (crawlerKey !== cronKey) {
      return res.status(403).json({
        success: false,
        message: '无效的密钥'
      });
    }
    
    const { daysWithin = 30 } = req.body;
    
    console.log(`\n🕷️ 收到爬取请求，爬取${daysWithin}天内的新闻...`);
    
    // 异步执行爬取（不阻塞响应）
    res.json({
      success: true,
      message: `爬取任务已启动，正在爬取${daysWithin}天内的新闻...`
    });
    
    // 后台执行爬取
    try {
      const results = await crawlerService.syncNews(daysWithin);
      console.log(`📊 爬取完成: 总计${results.total}条, 新增${results.added}条, 跳过${results.skipped}条, 失败${results.errors}条`);
    } catch (err) {
      console.error('❌ 爬取失败:', err.message);
    }
    
  } catch (error) {
    console.error('爬取请求失败:', error);
    res.status(500).json({
      success: false,
      message: '爬取失败: ' + error.message
    });
  }
});

module.exports = router;
