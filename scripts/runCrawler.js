/**
 * 运行浙江造价网爬虫脚本
 * 用法: node scripts/runCrawler.js [天数]
 * 默认爬取2天内的新闻
 */

const crawlerService = require('../services/crawlerService');

async function main() {
  const daysWithin = parseInt(process.argv[2]) || 2;
  
  console.log('='.repeat(50));
  console.log('🕷️ 浙江造价网政策文件爬虫');
  console.log(`📅 爬取范围: ${daysWithin}天内的新闻`);
  console.log('='.repeat(50));
  
  try {
    const results = await crawlerService.syncNews(daysWithin);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 爬取结果汇总:');
    console.log(`   总计发现: ${results.total} 条`);
    console.log(`   新增: ${results.added} 条`);
    console.log(`   跳过(已存在): ${results.skipped} 条`);
    console.log(`   失败: ${results.errors} 条`);
    if (results.stopped) {
      console.log('   ⚠️ 由于连续失败，爬取提前结束');
    }
    console.log('='.repeat(50));
    
    // 显示详情
    if (results.details && results.details.length > 0) {
      console.log('\n📋 详细记录:');
      results.details.forEach((item, index) => {
        const icon = item.status === 'added' ? '✅' : item.status === 'skipped' ? '⏭️' : '❌';
        console.log(`${index + 1}. ${icon} ${item.title.substring(0, 40)}...`);
        if (item.reason) console.log(`      原因: ${item.reason}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 爬虫运行失败:', error.message);
    process.exit(1);
  }
}

main();
