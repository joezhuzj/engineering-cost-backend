const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

// POST /api/auth/login - 用户登录
router.post('/login', authController.login);

// GET /api/auth/me - 获取当前用户信息（需要认证）
router.get('/me', authenticateToken, authController.me);

module.exports = router;
