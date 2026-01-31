const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const News = sequelize.define('News', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '新闻标题'
  },
  category: {
    type: DataTypes.ENUM('company', 'industry'),
    defaultValue: 'company',
    comment: '分类：company公司新闻，industry行业资讯'
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '摘要'
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: '内容'
  },
  cover_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图片URL'
  },
  badge: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '标签（如：热门、项目、培训）'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览次数'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft',
    comment: '状态：draft草稿，published已发布'
  },
  publish_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '发布日期'
  },
  author_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '作者ID'
  },
  attachments: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '附件列表JSON，格式：[{name, url, size, type}]',
    get() {
      const value = this.getDataValue('attachments');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('attachments', value ? JSON.stringify(value) : null);
    }
  }
}, {
  tableName: 'news',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = News;
