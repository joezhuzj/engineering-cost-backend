require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, News, Case, Contact } = require('../models');

const initDatabase = async () => {
  try {
    console.log('🔄 开始初始化数据库...\n');

    // 测试连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 同步所有模型（force: true 会删除已存在的表）
    console.log('🔄 同步数据库表...');
    await sequelize.sync({ force: true });
    console.log('✅ 数据库表同步完成\n');

    // 创建默认管理员
    console.log('🔄 创建默认管理员账号...');
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active'
    });
    console.log('✅ 管理员创建成功');
    console.log(`   用户名: admin`);
    console.log(`   密码: admin123`);
    console.log(`   ⚠️  请在生产环境中立即修改默认密码！\n`);

    // 创建示例新闻
    console.log('🔄 创建示例数据...');
    await News.bulkCreate([
      {
        title: '我司荣获"2025年度优秀造价咨询企业"称号',
        category: 'company',
        excerpt: '在刚刚结束的全国工程造价行业年度表彰大会上，我公司凭借专业的服务...',
        content: '在刚刚结束的全国工程造价行业年度表彰大会上，我公司凭借专业的服务质量和卓越的业绩表现，荣获"2025年度优秀造价咨询企业"称号。这一荣誉的获得，是对我司20年来坚持专业、诚信、创新的充分肯定。',
        badge: '热门',
        status: 'published',
        publish_date: new Date('2026-01-20'),
        author_id: admin.id
      },
      {
        title: '某大型城市综合体项目顺利结算审核',
        category: 'company',
        excerpt: '经过我司专业团队3个月的认真审核，某大型城市综合体项目...',
        content: '经过我司专业团队3个月的认真审核，某大型城市综合体项目结算工作圆满完成。该项目总投资15亿元，建筑面积25万平方米，我司为其提供了全过程造价咨询服务。',
        badge: '项目',
        status: 'published',
        publish_date: new Date('2026-01-15'),
        author_id: admin.id
      }
    ]);

    // 创建示例案例
    await Case.bulkCreate([
      {
        title: '某大型商业综合体',
        category: 'commercial',
        area: '12万㎡',
        cost: '8.5亿元',
        description: '提供全过程造价咨询服务，节约投资15%',
        status: 'published',
        completion_date: new Date('2025-12-01')
      },
      {
        title: '高端住宅小区项目',
        category: 'residential',
        area: '25万㎡',
        cost: '15亿元',
        description: '概预算编制及全过程跟踪审计',
        status: 'published',
        completion_date: new Date('2025-11-15')
      },
      {
        title: '市政道路桥梁工程',
        category: 'infrastructure',
        area: '8.5公里',
        cost: '3.2亿元',
        description: '招标控制价编制及结算审核服务',
        status: 'published',
        completion_date: new Date('2025-10-20')
      }
    ]);

    console.log('✅ 示例数据创建完成\n');

    console.log('🎉 数据库初始化完成！');
    console.log('\n📌 下一步操作：');
    console.log('   1. 启动服务器: npm run dev');
    console.log('   2. 访问: http://localhost:3000');
    console.log('   3. 使用管理员账号登录\n');

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

initDatabase();
