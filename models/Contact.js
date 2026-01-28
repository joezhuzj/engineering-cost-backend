const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '姓名'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '联系电话'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    },
    comment: '邮箱'
  },
  company: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '公司名称'
  },
  subject: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '主题'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '留言内容'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processed', 'archived'),
    defaultValue: 'pending',
    comment: '状态：pending待处理，processed已处理，archived已归档'
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'IP地址'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注（内部使用）'
  }
}, {
  tableName: 'contacts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Contact;
