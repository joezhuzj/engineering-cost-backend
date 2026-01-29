require('dotenv').config();
const { sequelize } = require('../config/database');
const { News, User } = require('../models');

const addIndustryNews = async () => {
  try {
    console.log('🔄 开始添加行业资讯...\n');

    // 测试连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 获取管理员用户
    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      console.error('❌ 未找到管理员用户，请先运行 npm run init-db');
      process.exit(1);
    }

    // 检查是否已存在行业资讯
    const existingIndustryNews = await News.count({ where: { category: 'industry' } });
    console.log(`📊 当前行业资讯数量: ${existingIndustryNews}`);

    if (existingIndustryNews >= 3) {
      console.log('✅ 行业资讯已存在，无需添加');
      process.exit(0);
    }

    // 创建行业资讯
    console.log('🔄 创建行业资讯...');
    const industryNews = await News.bulkCreate([
      {
        title: '国家发布最新工程造价管理办法',
        category: 'industry',
        excerpt: '为进一步规范工程造价管理，促进建设领域高质量发展，国家发展改革委员会近日发布了《工程造价管理办法（2026版）》...',
        content: '为进一步规范工程造价管理，促进建设领域高质量发展，国家发展改革委员会近日发布了《工程造价管理办法（2026版）》。新办法对工程造价咨询服务标准、收费规范、从业人员资格等方面做出了明确规定，将于2026年3月1日起正式施行。',
        badge: '政策解读',
        status: 'published',
        publish_date: new Date('2026-01-25'),
        author_id: admin.id
      },
      {
        title: 'BIM技术在造价管理中的应用趋势',
        category: 'industry',
        excerpt: '随着数字化转型的深入推进，BIM技术在工程造价管理中的应用越来越广泛...',
        content: '随着数字化转型的深入推进，BIM技术在工程造价管理中的应用越来越广泛。通过BIM技术，可以实现工程量自动计算、材料清单自动生成、造价动态管理等功能，大幅提升造价管理的效率和精度。预计到2027年，BIM技术在大型工程项目中的应用率将达到80%以上。',
        badge: '技术趋势',
        status: 'published',
        publish_date: new Date('2026-01-22'),
        author_id: admin.id
      },
      {
        title: '2026年建筑材料价格走势分析',
        category: 'industry',
        excerpt: '综合分析市场供需情况、原材料价格变化等因素，预测2026年主要建筑材料...',
        content: '综合分析市场供需情况、原材料价格变化等因素，预测2026年主要建筑材料价格将呈现稳中有升的态势。其中，钢材价格预计上涨5-8%，水泥价格基本持平，砂石料受环保政策影响价格可能上涨10-15%。建议项目方做好成本预测和风险管控。',
        badge: '市场分析',
        status: 'published',
        publish_date: new Date('2026-01-18'),
        author_id: admin.id
      }
    ]);

    console.log(`✅ 成功添加 ${industryNews.length} 条行业资讯\n`);

    // 显示总数
    const totalNews = await News.count();
    const companyNews = await News.count({ where: { category: 'company' } });
    const industryNewsCount = await News.count({ where: { category: 'industry' } });

    console.log('📊 当前新闻统计:');
    console.log(`   总数: ${totalNews}`);
    console.log(`   公司新闻: ${companyNews}`);
    console.log(`   行业资讯: ${industryNewsCount}\n`);

    console.log('🎉 行业资讯添加完成！');

  } catch (error) {
    console.error('❌ 添加失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

addIndustryNews();
