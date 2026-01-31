const { News } = require('../models');

(async () => {
  try {
    const news = await News.findAll({ 
      where: { category: 'industry' },
      order: [['publish_date', 'DESC']],
      limit: 15 
    });
    
    console.log('行业资讯数量:', news.length);
    console.log('---');
    
    news.forEach(n => {
      const att = n.attachments || [];
      const date = n.publish_date ? n.publish_date.toISOString().split('T')[0] : '无日期';
      console.log(`[${n.id}] ${n.title.substring(0, 35)}... | 附件:${att.length}个 | ${date}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('错误:', err.message);
    process.exit(1);
  }
})();
