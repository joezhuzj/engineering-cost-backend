/**
 * 数据库迁移脚本 - 同步模型结构到数据库
 */
const { sequelize } = require('../config/database');
require('../models'); // 加载所有模型

async function migrate() {
  console.log('🔄 开始数据库迁移...\n');
  
  try {
    // 使用 alter: true 来更新表结构（添加新字段，保留现有数据）
    await sequelize.sync({ alter: true });
    console.log('✅ 数据库迁移完成！');
    console.log('   - 已同步所有模型到数据库');
    console.log('   - 新增的字段已添加');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

migrate();
