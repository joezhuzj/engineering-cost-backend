const puppeteer = require('puppeteer');
const { News, User } = require('../models');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 浙江造价网爬虫服务 - 使用Puppeteer模拟真实浏览器
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
    return await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-size=1920,1080',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list'
      ],
      ignoreHTTPSErrors: true
    });
  }

  /**
   * 创建页面并设置真实浏览器特征
   */
  async createPage(browser) {
    const page = await browser.newPage();
    
    // 设置UA
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // 设置请求头
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // 注入JS来隐藏webdriver特征
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
      window.chrome = { runtime: {} };
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
        waitUntil: 'networkidle2',
        timeout: 60000 
      });
      
      // 模拟人类查看页面
      await this.humanDelay(1500, 3000);
      
      // 滚动页面，模拟阅读行为
      await page.evaluate(() => {
        window.scrollBy(0, 300);
      });
      await this.humanDelay(500, 1000);
      
      // 等待页面加载 - 使用实际的选择器
      await page.waitForSelector('.lists ul li', { timeout: 10000 }).catch(() => {});
      
      // 获取新闻列表
      const newsList = await page.evaluate((daysWithin, baseUrl) => {
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - daysWithin * 24 * 60 * 60 * 1000);
        const results = [];
        
        // 查找所有新闻项 - 实际结构是 .lists ul li
        const newsItems = document.querySelectorAll('.lists ul li');
        
        newsItems.forEach(item => {
          // 日期在 span 中
          const dateSpan = item.querySelector('span');
          const dateText = dateSpan ? dateSpan.textContent.trim() : '';
          
          // 链接和标题在 a 中
          const linkEl = item.querySelector('a');
          if (!linkEl) return;
          
          const title = linkEl.getAttribute('title') || linkEl.textContent.trim();
          const href = linkEl.getAttribute('href');
          
          if (!title || !dateText || !href) return;
          
          // 过滤非详情页链接
          if (!href.includes('/detailed/')) return;
          
          const newsDate = new Date(dateText);
          
          if (newsDate >= cutoffDate) {
            const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
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
   * 确保目录存在
   */
  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 下载附件文件
   */
  async downloadAttachment(fileUrl, filename) {
    return new Promise((resolve, reject) => {
      const attachmentsDir = path.join(__dirname, '..', 'uploads', 'attachments');
      this.ensureDir(attachmentsDir);
      
      // 生成唯一文件名，避免重复
      const timestamp = Date.now();
      const safeFilename = filename.replace(/[\\/:*?"<>|]/g, '_');
      const finalFilename = `${timestamp}_${safeFilename}`;
      const filepath = path.join(attachmentsDir, finalFilename);
      
      const protocol = fileUrl.startsWith('https') ? https : http;
      
      console.log(`    📥 下载附件: ${filename}`);
      
      const request = protocol.get(fileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': this.baseUrl
        }
      }, (response) => {
        // 处理重定向
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          this.downloadAttachment(redirectUrl, filename).then(resolve).catch(reject);
          return;
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`下载失败: HTTP ${response.statusCode}`));
          return;
        }
        
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          const stats = fs.statSync(filepath);
          console.log(`    ✅ 附件已保存: ${finalFilename} (${(stats.size / 1024).toFixed(1)}KB)`);
          resolve({
            name: filename,
            url: `/uploads/attachments/${finalFilename}`,
            size: stats.size,
            type: path.extname(filename).slice(1) || 'unknown'
          });
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(filepath, () => {});
          reject(err);
        });
      });
      
      request.on('error', reject);
      request.setTimeout(60000, () => {
        request.destroy();
        reject(new Error('下载超时'));
      });
    });
  }

  /**
   * 获取新闻详情内容和附件
   */
  async fetchNewsContent(url) {
    let browser = null;
    
    try {
      browser = await this.createBrowser();
      const page = await this.createPage(browser);
      
      console.log(`  📄 获取详情: ${url.substring(0, 60)}...`);
      
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // 模拟阅读
      await this.humanDelay(1000, 2000);
      
      // 获取内容和附件链接
      const result = await page.evaluate((baseUrl) => {
        // 浙江造价网详情页的正文选择器
        const contentSelectors = [
          '#ContentTextb',           // 浙江造价网正文区域
          '.detail-text',
          '.article-body',
          '.news-body'
        ];
        
        let text = '';
        let contentEl = null;
        
        // 优先使用精确选择器
        for (const selector of contentSelectors) {
          const el = document.querySelector(selector);
          if (el) {
            const found = el.innerText.trim();
            if (found && found.length > 50) {
              text = found;
              contentEl = el;
              break;
            }
          }
        }
        
        // 如果没找到，尝试其他选择器
        if (!text) {
          const fallbackSelectors = ['.info', '.detail-content', '.article-content'];
          for (const selector of fallbackSelectors) {
            const el = document.querySelector(selector);
            if (el) {
              const found = el.innerText.trim();
              if (found && found.length > text.length) {
                text = found;
                contentEl = el;
              }
            }
          }
        }
        
        // 查找附件链接 - 扩大搜索范围
        const attachments = [];
        const attachmentSelectors = [
          'a[href*=".pdf"]', 'a[href*=".doc"]', 'a[href*=".docx"]',
          'a[href*=".xls"]', 'a[href*=".xlsx"]', 'a[href*=".zip"]',
          'a[href*=".rar"]', 'a[href*=".ppt"]', 'a[href*=".pptx"]',
          'a[href*="download"]', 'a[href*="attachment"]', 'a[href*="file"]',
          '.attachment a', '.file-list a', '.download-list a',
          'a[download]', 'a.download'
        ];
        
        // 在整个页面中查找附件
        const searchAreas = [document.body];
        if (contentEl) searchAreas.unshift(contentEl);
        
        const seenUrls = new Set();
        
        for (const area of searchAreas) {
          for (const selector of attachmentSelectors) {
            const links = area.querySelectorAll(selector);
            links.forEach(link => {
              let href = link.getAttribute('href');
              if (!href) return;
              
              // 过滤非文件链接
              if (href.startsWith('javascript:') || href === '#') return;
              
              // 转换为绝对URL
              if (!href.startsWith('http')) {
                href = href.startsWith('/') ? `${baseUrl}${href}` : `${baseUrl}/${href}`;
              }
              
              // 去重
              if (seenUrls.has(href)) return;
              seenUrls.add(href);
              
              // 获取文件名
              let name = link.textContent.trim() || link.getAttribute('title') || '';
              // 从href提取文件名作为备选
              if (!name || name.length > 100) {
                const urlParts = href.split('/');
                name = decodeURIComponent(urlParts[urlParts.length - 1].split('?')[0]) || '附件';
              }
              
              attachments.push({ name, originalUrl: href });
            });
          }
        }
        
        return {
          content: text || '详情请查看原文链接',
          attachmentLinks: attachments
        };
      }, this.baseUrl);
      
      // 下载附件
      const attachments = [];
      if (result.attachmentLinks && result.attachmentLinks.length > 0) {
        console.log(`  📎 发现 ${result.attachmentLinks.length} 个附件`);
        
        for (const att of result.attachmentLinks) {
          try {
            // 添加延迟避免被封
            await this.humanDelay(500, 1500);
            const downloaded = await this.downloadAttachment(att.originalUrl, att.name);
            attachments.push(downloaded);
          } catch (err) {
            console.error(`    ⚠️ 附件下载失败: ${att.name}`, err.message);
            // 保留原始链接作为备选
            attachments.push({
              name: att.name,
              url: att.originalUrl,
              size: 0,
              type: 'link',
              isExternal: true
            });
          }
        }
      }
      
      return {
        content: result.content,
        attachments: attachments
      };
      
    } catch (error) {
      this.failureCount++;
      console.error(`  ❌ 获取详情失败 (${this.failureCount}/${this.maxFailures}):`, error.message);
      
      if (this.failureCount >= this.maxFailures) {
        throw new Error(`连续失败${this.maxFailures}次，停止爬取`);
      }
      
      return {
        content: '详情请查看原文链接',
        attachments: []
      };
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
          
          // 获取详情内容和附件
          const { content, attachments } = await this.fetchNewsContent(news.url);

          // 创建新闻
          await News.create({
            title: news.title,
            category: 'industry',
            excerpt: `来源：${news.source}，发布日期：${news.dateText}`,
            content: content + `\n\n原文链接：${news.url}`,
            badge: '政策',
            status: 'published',
            publish_date: news.publishDate,
            author_id: admin.id,
            attachments: attachments.length > 0 ? attachments : null
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
