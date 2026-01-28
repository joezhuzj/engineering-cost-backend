const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken } = require('../middlewares/auth');

// 公开接口
router.post('/', contactController.submit);  // 提交联系表单

// 需要认证的接口
router.get('/', authenticateToken, contactController.getAll);         // 获取联系记录列表
router.get('/stats', authenticateToken, contactController.getStats);  // 获取统计数据
router.get('/:id', authenticateToken, contactController.getOne);      // 获取单个联系记录
router.put('/:id', authenticateToken, contactController.update);      // 更新联系记录
router.delete('/:id', authenticateToken, contactController.delete);   // 删除联系记录

module.exports = router;
