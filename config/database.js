const { Sequelize } = require('sequelize');
require('dotenv').config();
const path = require('path');

// 创建Sequelize实例 - 使用SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'), // 数据库文件路径
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功!');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
};

module.exports = { sequelize, testConnection };
