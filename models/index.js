const User = require('./User');
const News = require('./News');
const Case = require('./Case');
const Contact = require('./Contact');

// 定义模型关联关系
User.hasMany(News, { foreignKey: 'author_id', as: 'news' });
News.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

module.exports = {
  User,
  News,
  Case,
  Contact
};
