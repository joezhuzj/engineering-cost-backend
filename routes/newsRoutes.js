const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticateToken } = require('../middlewares/auth');

// 公开接口
router.get('/', newsController.getAll);           // 获取新闻列表
router.get('/:id', newsController.getOne);        // 获取单个新闻

// 需要认证的接口
router.post('/', authenticateToken, newsController.create);      // 创建新闻
router.put('/:id', authenticateToken, newsController.update);    // 更新新闻
router.delete('/:id', authenticateToken, newsController.delete); // 删除新闻

module.exports = router;
