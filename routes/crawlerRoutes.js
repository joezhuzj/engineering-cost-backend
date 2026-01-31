const express = require('express');
const router = express.Router();
const { News, User } = require('../models');

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

module.exports = router;
