const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
const { User, News, Case } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS配置 - 允许前端和管理后台访问
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://engineering-cost-frontend.onrender.com',
    'https://engineering-cost-admin.onrender.com',
    'https://engineering-cost-consulting.vercel.app'
  ],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// 路由
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/news', require('./routes/newsRoutes'));
app.use('/api/cases', require('./routes/caseRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/crawler', require('./routes/crawlerRoutes'));

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

// 初始化数据库和默认数据
const initializeDatabase = async () => {
  // 同步数据库表结构（如果表不存在则创建）
  await sequelize.sync();
  console.log('✅ 数据库表同步完成');

  // 检查是否存在管理员，不存在则创建
  const adminCount = await User.count({ where: { role: 'admin' } });
  if (adminCount === 0) {
    await User.create({
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active'
    });
    console.log('✅ 默认管理员创建成功 (admin/admin123)');

    // 创建示例新闻
    await News.bulkCreate([
      {
        title: '我司荣获"2025年度优秀造价咨询企业"称号',
        category: 'company',
        excerpt: '在刚刚结束的全国工程造价行业年度表彰大会上，我公司凭借专业的服务...',
        content: '在刚刚结束的全国工程造价行业年度表彰大会上，我公司凭借专业的服务质量和卓越的业绩表现，荣获"2025年度优秀造价咨询企业"称号。',
        badge: '热门',
        status: 'published',
        publish_date: new Date('2026-01-20'),
        author_id: 1
      },
      {
        title: '某大型城市综合体项目顺利结算审核',
        category: 'company',
        excerpt: '经过我司专业团队3个月的认真审核，某大型城市综合体项目...',
        content: '经过我司专业团队3个月的认真审核，某大型城市综合体项目结算工作圆满完成。',
        badge: '项目',
        status: 'published',
        publish_date: new Date('2026-01-15'),
        author_id: 1
      },
      {
        title: '国家发布最新工程造价管理办法',
        category: 'industry',
        excerpt: '为进一步规范工程造价管理，促进建设领域高质量发展，国家发展改革委员会近日发布了《工程造价管理办法（2026版）》...',
        content: '为进一步规范工程造价管理，促进建设领域高质量发展，国家发展改革委员会近日发布了《工程造价管理办法（2026版）》。新办法对工程造价咨询服务标准、收费规范、从业人员资格等方面做出了明确规定，将于2026年3月1日起正式施行。',
        badge: '政策解读',
        status: 'published',
        publish_date: new Date('2026-01-25'),
        author_id: 1
      },
      {
        title: 'BIM技术在造价管理中的应用趋势',
        category: 'industry',
        excerpt: '随着数字化转型的深入推进，BIM技术在工程造价管理中的应用越来越广泛...',
        content: '随着数字化转型的深入推进，BIM技术在工程造价管理中的应用越来越广泛。通过BIM技术，可以实现工程量自动计算、材料清单自动生成、造价动态管理等功能，大幅提升造价管理的效率和精度。预计到2027年，BIM技术在大型工程项目中的应用率将达到80%以上。',
        badge: '技术趋势',
        status: 'published',
        publish_date: new Date('2026-01-22'),
        author_id: 1
      },
      {
        title: '2026年建筑材料价格走势分析',
        category: 'industry',
        excerpt: '综合分析市场供需情况、原材料价格变化等因素，预测2026年主要建筑材料...',
        content: '综合分析市场供需情况、原材料价格变化等因素，预测2026年主要建筑材料价格将呈现稳中有升的态势。其中，钢材价格预计上涨5-8%，水泥价格基本持平，砂石料受环保政策影响价格可能上涨10-15%。建议项目方做好成本预测和风险管控。',
        badge: '市场分析',
        status: 'published',
        publish_date: new Date('2026-01-18'),
        author_id: 1
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
    console.log('✅ 示例数据创建完成');
  }
};

// 启动服务器
const start = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 初始化数据库
    await initializeDatabase();
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
