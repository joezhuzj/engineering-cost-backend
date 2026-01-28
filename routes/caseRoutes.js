const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { authenticateToken } = require('../middlewares/auth');

// 公开接口
router.get('/', caseController.getAll);           // 获取案例列表
router.get('/:id', caseController.getOne);        // 获取单个案例

// 需要认证的接口
router.post('/', authenticateToken, caseController.create);      // 创建案例
router.put('/:id', authenticateToken, caseController.update);    // 更新案例
router.delete('/:id', authenticateToken, caseController.delete); // 删除案例

module.exports = router;
