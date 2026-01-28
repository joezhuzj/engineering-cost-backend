const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// 路由
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/news', require('./routes/newsRoutes'));
app.use('/api/cases', require('./routes/caseRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '工程造价咨询API服务',
    version: '1.0.0'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
const start = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 同步数据库（仅在开发环境且表不存在时）
    // 注意：如果已经运行过 npm run init-db，这里不需要再次同步
    // await sequelize.sync({ alter: true });
    console.log('✅ 数据库已就绪');
    
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

start();
