/**
 * 本地爬取新闻后同步到远程服务器
 * 用法: node scripts/syncToRemote.js [天数]
 */

const crawlerService = require('../services/crawlerService');
const https = require('https');
const http = require('http');

// 远程API配置
const REMOTE_API = process.env.REMOTE_API || 'https://engineering-cost-backend.onrender.com';
const CRAWLER_KEY = process.env.CRON_SECRET || 'zjzj-crawler-2026';

/**
 * 检查哪些新闻已存在
 */
async function checkExisting(titles) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${REMOTE_API}/api/crawler/check-exists`);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const postData = JSON.stringify({ titles });
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-crawler-key': CRAWLER_KEY
      }
    };
    
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.existingTitles || []);
        } catch (e) {
          resolve([]);
        }
      });
    });
    
    req.on('error', () => resolve([]));
    req.write(postData);
    req.end();
  });
}

/**
 * 提交新闻到远程服务器
 */
async function submitToRemote(newsData) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${REMOTE_API}/api/crawler/submit`);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const postData = JSON.stringify(newsData);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-crawler-key': CRAWLER_KEY
      }
    };
    
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ success: false, message: data });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const daysWithin = parseInt(process.argv[2]) || 60;
  
  console.log('='.repeat(50));
  console.log('🔄 本地爬取 + 远程同步');
  console.log(`📅 爬取范围: ${daysWithin}天内的新闻`);
  console.log(`🌐 远程服务器: ${REMOTE_API}`);
  console.log('='.repeat(50));
  
  try {
    // 第一步：本地爬取新闻列表
    console.log('\n📥 第1步: 爬取新闻列表...');
    const newsList = await crawlerService.fetchPolicyNews(daysWithin);
    
    if (newsList.length === 0) {
      console.log('📭 没有找到新的政策文件');
      process.exit(0);
    }
    
    console.log(`✅ 找到 ${newsList.length} 条新闻`);
    
    // 第二步：检查哪些已存在
    console.log('\n🔍 第2步: 检查已存在的新闻...');
    const titles = newsList.map(n => n.title);
    const existingTitles = await checkExisting(titles);
    
    // 过滤掉已存在的
    const newNews = newsList.filter(n => !existingTitles.includes(n.title));
    const skippedCount = newsList.length - newNews.length;
    
    console.log(`   已存在: ${skippedCount} 条（跳过）`);
    console.log(`   待爬取: ${newNews.length} 条`);
    
    if (newNews.length === 0) {
      console.log('\n💭 所有新闻都已存在，无需同步');
      process.exit(0);
    }
    
    // 第三步：逐条获取详情和附件，然后同步到远程
    console.log('\n📤 第3步: 获取详情并同步到远程服务器...\n');
    
    let added = 0, failed = 0;
    
    for (const news of newNews) {
      try {
        console.log(`  处理: ${news.title.substring(0, 40)}...`);
        
        // 添加延迟
        await crawlerService.humanDelay(2000, 4000);
        
        // 获取详情和附件
        const { content, attachments } = await crawlerService.fetchNewsContent(news.url);
        
        // 构建新闻数据 - 附件使用原始外部链接
        const newsData = {
          title: news.title,
          category: 'industry',
          excerpt: `来源：${news.source}，发布日期：${news.dateText}`,
          content: content + `\n\n原文链接：${news.url}`,
          badge: '政策',
          status: 'published',
          publish_date: news.dateText,
          // 附件使用外部链接，不上传到服务器
          attachments: attachments.map(att => ({
            name: att.name,
            url: att.isExternal ? att.url : att.originalUrl || att.url,
            size: att.size || 0,
            type: att.type || 'unknown',
            isExternal: true
          }))
        };
        
        // 提交到远程
        const result = await submitToRemote(newsData);
        
        if (result.success) {
          console.log(`    ✅ 已同步 (附件: ${attachments.length}个)`);
          added++;
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
    console.log('📊 同步结果汇总:');
    console.log(`   新增: ${added} 条`);
    console.log(`   跳过: ${skippedCount} 条（已存在）`);
    console.log(`   失败: ${failed} 条`);
    console.log('='.repeat(50));
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ 同步失败:', error.message);
    process.exit(1);
  }
}

main();
