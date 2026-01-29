const express = require('express');
const router = express.Router();
const crawlerService = require('../services/crawlerService');
const { authenticateToken } = require('../middlewares/auth');

/**
 * 手动触发爬虫同步
 * POST /api/crawler/sync
 * 需要管理员认证
 */
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { days = 2 } = req.body;
    
    console.log(`\n========== 手动触发爬虫同步 ==========`);
    console.log(`触发时间: ${new Date().toISOString()}`);
    console.log(`同步天数: ${days}天内`);
    
    const results = await crawlerService.syncNews(days);
    
    res.json({
      success: true,
      message: `同步完成: 新增${results.added}条, 跳过${results.skipped}条`,
      data: results
    });
  } catch (error) {
    console.error('爬虫同步失败:', error);
    res.status(500).json({
      success: false,
      message: '同步失败: ' + error.message
    });
  }
});

/**
 * 定时任务触发接口（供外部定时服务调用）
 * GET /api/crawler/cron
 * 使用简单的密钥验证
 */
router.get('/cron', async (req, res) => {
  try {
    // 简单的密钥验证（防止被随意调用）
    const { key } = req.query;
    const cronKey = process.env.CRON_SECRET || 'zjzj-crawler-2026';
    
    if (key !== cronKey) {
      return res.status(403).json({
        success: false,
        message: '无效的密钥'
      });
    }
    
    console.log(`\n========== 定时任务触发爬虫同步 ==========`);
    console.log(`触发时间: ${new Date().toISOString()}`);
    
    const results = await crawlerService.syncNews(2); // 默认获取2天内的新闻
    
    res.json({
      success: true,
      message: `定时同步完成: 新增${results.added}条, 跳过${results.skipped}条`,
      data: {
        total: results.total,
        added: results.added,
        skipped: results.skipped,
        errors: results.errors
      }
    });
  } catch (error) {
    console.error('定时爬虫同步失败:', error);
    res.status(500).json({
      success: false,
      message: '同步失败: ' + error.message
    });
  }
});

/**
 * 预览爬取结果（不入库）
 * GET /api/crawler/preview
 * 需要管理员认证
 */
router.get('/preview', authenticateToken, async (req, res) => {
  try {
    const { days = 2 } = req.query;
    
    console.log(`预览爬取 ${days}天内 的政策文件...`);
    const newsList = await crawlerService.fetchPolicyNews(parseInt(days));
    
    res.json({
      success: true,
      message: `找到 ${newsList.length} 条新闻`,
      data: { news: newsList }
    });
  } catch (error) {
    console.error('预览失败:', error);
    res.status(500).json({
      success: false,
      message: '预览失败: ' + error.message
    });
  }
});

module.exports = router;
