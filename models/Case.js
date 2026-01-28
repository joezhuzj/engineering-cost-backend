const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Case = sequelize.define('Case', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '案例标题'
  },
  category: {
    type: DataTypes.ENUM('commercial', 'residential', 'infrastructure', 'industrial'),
    allowNull: false,
    comment: '分类：commercial商业，residential住宅，infrastructure基础设施，industrial工业'
  },
  area: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '面积或规模'
  },
  cost: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '造价'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '简要描述'
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: '详细内容'
  },
  cover_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图片URL'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '案例图片列表（JSON数组）'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '标签列表（JSON数组）'
  },
  completion_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '完成日期'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft',
    comment: '状态'
  }
}, {
  tableName: 'cases',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Case;
