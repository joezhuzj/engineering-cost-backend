const { chromium } = require('playwright');
const { News, User } = require('../models');

// 浙江造价网爬虫服务 - 使用Playwright模拟真实浏览器
class CrawlerService {
  constructor() {
    this.baseUrl = 'https://www.zjzj.net';
    this.policyUrl = 'https://www.zjzj.net/news/newsInfor/10'; // 政策文件页面
    this.maxFailures = 3; // 最大失败次数，超过则停止
    this.failureCount = 0;
  }

  /**
   * 随机延迟 - 模拟人类行为
   */
  async humanDelay(min = 2000, max = 5000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`🕐 等待 ${(delay / 1000).toFixed(1)} 秒...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 创建浏览器实例
   */
  async createBrowser() {
    return await chromium.launch({
      headless: true, // 无头模式
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
  }

  /**
   * 创建页面并设置真实浏览器特征
   */
  async createPage(browser) {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai'
    });
    
    const page = await context.newPage();
    
    // 设置请求头
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    });
    
    return page;
  }

  /**
   * 爬取政策文件列表
   */
  async fetchPolicyNews(daysWithin = 2) {
    let browser = null;
    
    try {
      console.log(`\n🔄 开始爬取浙江造价网政策文件 (${daysWithin}天内)...`);
      console.log(`🌐 目标网址: ${this.policyUrl}`);
      
      browser = await this.createBrowser();
      const page = await this.createPage(browser);
      
      // 访问页面
      console.log('🚀 正在打开页面...');
      await page.goto(this.policyUrl, { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });
      
      // 模拟人类查看页面
      await this.humanDelay(1500, 3000);
      
      // 滚动页面，模拟阅读行为
      await page.evaluate(() => {
        window.scrollBy(0, 300);
      });
      await this.humanDelay(500, 1000);
      
      // 获取新闻列表
      const newsList = await page.evaluate((daysWithin, baseUrl) => {
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - daysWithin * 24 * 60 * 60 * 1000);
        const results = [];
        
        // 查找所有新闻链接
        const newsItems = document.querySelectorAll('.news-ul a');
        
        newsItems.forEach(item => {
          const title = item.getAttribute('title') || item.querySelector('.title')?.textContent?.trim();
          const href = item.getAttribute('href');
          const timeEl = item.querySelector('.time');
          const dateText = timeEl ? timeEl.textContent.trim() : '';
          
          if (!title || !dateText) return;
          
          const newsDate = new Date(dateText);
          
          if (newsDate >= cutoffDate) {
            const fullUrl = href.startsWith('http') ? href : `${baseUrl}/${href}`;
            results.push({
              title: title.trim(),
              url: fullUrl,
              dateText: dateText,
              source: '浙江造价网'
            });
          }
        });
        
        return results;
      }, daysWithin, this.baseUrl);
      
      // 去重
      const uniqueNews = [];
      const seenTitles = new Set();
      for (const news of newsList) {
        if (!seenTitles.has(news.title)) {
          seenTitles.add(news.title);
          news.publishDate = new Date(news.dateText);
          uniqueNews.push(news);
        }
      }
      
      console.log(`✅ 爬取完成，找到 ${uniqueNews.length} 条${daysWithin}天内的新闻`);
      
      // 重置失败计数
      this.failureCount = 0;
      
      return uniqueNews;
      
    } catch (error) {
      this.failureCount++;
      console.error(`❌ 爬取失败 (${this.failureCount}/${this.maxFailures}):`, error.message);
      
      if (this.failureCount >= this.maxFailures) {
        console.error('🛑 达到最大失败次数，停止爬取');
        throw new Error(`连续失败${this.maxFailures}次，停止爬取`);
      }
      
      throw error;
    } finally {
      if (browser) {
        await browser.close();
        console.log('🔒 浏览器已关闭');
      }
    }
  }

  /**
   * 获取新闻详情内容
   */
  async fetchNewsContent(url) {
    let browser = null;
    
    try {
      browser = await this.createBrowser();
      const page = await this.createPage(browser);
      
      console.log(`  📄 获取详情: ${url.substring(0, 60)}...`);
      
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // 模拟阅读
      await this.humanDelay(1000, 2000);
      
      // 获取内容
      const content = await page.evaluate(() => {
        const selectors = ['.article-content', '.news-content', '.content', '.detail-content', '#content', '.main-content'];
        let text = '';
        
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el) {
            const found = el.textContent.trim();
            if (found && found.length > text.length) {
              text = found;
            }
          }
        }
        
        return text || '详情请查看原文链接';
      });
      
      return content;
      
    } catch (error) {
      this.failureCount++;
      console.error(`  ❌ 获取详情失败 (${this.failureCount}/${this.maxFailures}):`, error.message);
      
      if (this.failureCount >= this.maxFailures) {
        throw new Error(`连续失败${this.maxFailures}次，停止爬取`);
      }
      
      return '详情请查看原文链接';
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * 同步新闻到数据库
   */
  async syncNews(daysWithin = 2) {
    const results = {
      total: 0,
      added: 0,
      skipped: 0,
      errors: 0,
      stopped: false,
      details: []
    };
    
    // 重置失败计数
    this.failureCount = 0;

    try {
      // 爬取新闻列表
      const newsList = await this.fetchPolicyNews(daysWithin);
      results.total = newsList.length;

      if (newsList.length === 0) {
        console.log('📭 没有找到新的政策文件');
        return results;
      }

      // 获取管理员用户作为作者
      let admin = await User.findOne({ where: { role: 'admin' } });
      if (!admin) {
        console.warn('⚠️ 未找到管理员用户，使用ID=1');
        admin = { id: 1 };
      }

      // 逐条处理
      for (const news of newsList) {
        // 检查是否达到失败上限
        if (this.failureCount >= this.maxFailures) {
          console.error(`🛑 失败次数达到${this.maxFailures}次，停止同步`);
          results.stopped = true;
          break;
        }
        
        try {
          // 检查是否已存在
          const existing = await News.findOne({
            where: { title: news.title }
          });

          if (existing) {
            console.log(`⏭️ 跳过已存在: ${news.title}`);
            results.skipped++;
            results.details.push({ title: news.title, status: 'skipped', reason: '已存在' });
            continue;
          }

          // 模拟人类阅读间隔
          await this.humanDelay(3000, 6000);
          
          // 获取详情内容
          const content = await this.fetchNewsContent(news.url);

          // 创建新闻
          await News.create({
            title: news.title,
            category: 'industry',
            excerpt: `来源：${news.source}，发布日期：${news.dateText}`,
            content: content + `\n\n原文链接：${news.url}`,
            badge: '政策',
            status: 'published',
            publish_date: news.publishDate,
            author_id: admin.id
          });

          console.log(`✅ 已添加: ${news.title}`);
          results.added++;
          results.details.push({ title: news.title, status: 'added' });
          
          // 成功后重置失败计数
          this.failureCount = 0;

        } catch (err) {
          console.error(`❌ 处理失败: ${news.title}`, err.message);
          results.errors++;
          results.details.push({ title: news.title, status: 'error', reason: err.message });
          
          // 检查是否需要停止
          if (this.failureCount >= this.maxFailures) {
            results.stopped = true;
            break;
          }
        }
      }

      console.log(`\n📊 同步完成: 总计${results.total}条, 新增${results.added}条, 跳过${results.skipped}条, 失败${results.errors}条`);
      if (results.stopped) {
        console.log('⚠️ 由于连续失败，同步提前结束');
      }
      
      return results;

    } catch (error) {
      console.error('❌ 同步失败:', error.message);
      results.stopped = true;
      throw error;
    }
  }
}

module.exports = new CrawlerService();
