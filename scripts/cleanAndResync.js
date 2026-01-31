/**
 * 清理线上爬取的新闻并重新同步
 */

const https = require('https');
const crawlerService = require('../services/crawlerService');

const REMOTE_API = 'https://engineering-cost-backend.onrender.com';
const CRAWLER_KEY = 'zjzj-crawler-2026';

// 需要删除的新闻标题关键词（爬取的新闻）
const CRAWLED_TITLES = [
  '关于征求', '关于征集', '关于印发', '关于开展', '关于公布',
  '风险预警', '省造价管理总站', '继续教育'
];

async function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${REMOTE_API}${path}`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-crawler-key': CRAWLER_KEY
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function submitToRemote(newsData) {
  return apiRequest('POST', '/api/crawler/submit', newsData);
}

async function main() {
  const daysWithin = parseInt(process.argv[2]) || 60;
  
  console.log('='.repeat(50));
  console.log('🔄 清理旧数据并重新同步（修复版）');
  console.log(`📅 爬取范围: ${daysWithin}天内的新闻`);
  console.log('='.repeat(50));
  
  try {
    // 第一步：获取线上新闻列表
    console.log('\n📋 第1步: 获取线上新闻列表...');
    const response = await apiRequest('GET', '/api/news?category=industry&limit=100&status=');
    const remoteNews = response.data?.news || [];
    console.log(`  线上共有 ${remoteNews.length} 条行业资讯`);
    
    // 找出需要删除的（爬取的）新闻ID
    const toDelete = remoteNews.filter(n => 
      CRAWLED_TITLES.some(keyword => n.title.includes(keyword))
    );
    console.log(`  其中 ${toDelete.length} 条是爬取的新闻，将删除后重新同步`);
    
    // 删除旧的爬取新闻
    if (toDelete.length > 0) {
      const idsToDelete = toDelete.map(n => n.id);
      console.log(`\n🗑️ 删除旧数据: ${idsToDelete.join(', ')}`);
      
      const deleteResult = await apiRequest('POST', '/api/crawler/delete', { ids: idsToDelete });
      if (deleteResult.success) {
        console.log(`  ✅ 已删除 ${deleteResult.deleted} 条新闻`);
      } else {
        console.log(`  ⚠️ 删除失败: ${deleteResult.message}`);
      }
    }
    
    // 记录保留的标题（非爬取的）
    const keptNews = remoteNews.filter(n => 
      !CRAWLED_TITLES.some(keyword => n.title.includes(keyword))
    );
    const existingTitles = new Set(keptNews.map(n => n.title));
    
    // 第二步：本地爬取新闻
    console.log('\n📥 第2步: 本地爬取新闻...');
    const newsList = await crawlerService.fetchPolicyNews(daysWithin);
    
    if (newsList.length === 0) {
      console.log('📭 没有找到新的政策文件');
      process.exit(0);
    }
    
    console.log(`✅ 找到 ${newsList.length} 条新闻`);
    
    // 所有爬取的新闻都是新增（旧的已删除）
    const toAdd = newsList.filter(n => !existingTitles.has(n.title));
    
    console.log(`  需要新增: ${toAdd.length} 条`);
    
    // 第三步：处理需要更新的新闻（使用特殊标记）
    console.log('\n📤 第3步: 同步新闻到远程服务器...\n');
    
    let added = 0, failed = 0;
    
    for (const news of toAdd) {
      try {
        console.log(`  新增: ${news.title.substring(0, 35)}...`);
        
        await crawlerService.humanDelay(2000, 4000);
        
        // 获取详情和附件
        const { content, attachments } = await crawlerService.fetchNewsContent(news.url);
        
        // 构建新闻数据
        const newsData = {
          title: news.title,
          category: 'industry',
          excerpt: `来源：${news.source}，发布日期：${news.dateText}`,
          content: content + `\n\n原文链接：${news.url}`,
          badge: '政策',
          status: 'published',
          publish_date: news.dateText,
          attachments: attachments.map(att => ({
            name: att.name,
            url: att.isExternal ? att.url : att.originalUrl || att.url,
            size: att.size || 0,
            type: att.type || 'unknown',
            isExternal: true
          }))
        };
        
        const result = await submitToRemote(newsData);
        
        if (result.success) {
          if (result.action === 'skipped') {
            console.log(`    ⏭️ 已存在，跳过`);
          } else {
            console.log(`    ✅ 完成 (附件: ${attachments.length}个)`);
            added++;
          }
        } else {
          console.log(`    ❌ 失败: ${result.message}`);
          failed++;
        }
        
      } catch (err) {
        console.error(`    ❌ 错误: ${err.message}`);
        failed++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 同步结果:');
    console.log(`   新增: ${added} 条`);
    console.log(`   失败: ${failed} 条`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ 同步失败:', error.message);
    process.exit(1);
  }
}

main();
