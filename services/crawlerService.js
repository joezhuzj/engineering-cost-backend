const axios = require('axios');
const cheerio = require('cheerio');
const { News, User } = require('../models');
const { Op } = require('sequelize');

// 浙江造价网爬虫服务
class CrawlerService {
  constructor() {
    this.baseUrl = 'https://www.zjzj.net';
    this.policyUrl = 'https://www.zjzj.net/news/newsInfor/10'; // 政策文件页面
  }

  /**
   * 爬取政策文件列表
   * @param {number} daysWithin - 获取多少天内的新闻
   * @returns {Array} 新闻列表
   */
  async fetchPolicyNews(daysWithin = 2) {
    try {
      console.log(`🔄 开始爬取浙江造价网政策文件 (${daysWithin}天内)...`);

      // 获取页面内容
      const response = await axios.get(this.policyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const newsList = [];
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - daysWithin * 24 * 60 * 60 * 1000);

      // 解析新闻列表 - 查找政策文件板块
      $('.news-ul a').each((index, element) => {
        const $item = $(element);
        const title = $item.attr('title') || $item.find('.title').text().trim();
        const href = $item.attr('href');
        const dateText = $item.find('.time').text().trim();

        if (!title || !dateText) return;

        // 解析日期
        const newsDate = new Date(dateText);
        
        // 只获取指定天数内的新闻
        if (newsDate >= cutoffDate) {
          const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}/${href}`;
          
          newsList.push({
            title: title.trim(),
            url: fullUrl,
            publishDate: newsDate,
            dateText: dateText,
            source: '浙江造价网'
          });
        }
      });

      // 去重（同一标题只保留一条）
      const uniqueNews = [];
      const seenTitles = new Set();
      for (const news of newsList) {
        if (!seenTitles.has(news.title)) {
          seenTitles.add(news.title);
          uniqueNews.push(news);
        }
      }

      console.log(`✅ 爬取完成，找到 ${uniqueNews.length} 条${daysWithin}天内的新闻`);
      return uniqueNews;

    } catch (error) {
      console.error('❌ 爬取失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取新闻详情内容
   * @param {string} url - 新闻详情页URL
   * @returns {string} 新闻内容
   */
  async fetchNewsContent(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      
      // 尝试多种选择器获取内容
      let content = '';
      const selectors = ['.article-content', '.news-content', '.content', '.detail-content', '#content'];
      
      for (const selector of selectors) {
        const found = $(selector).text().trim();
        if (found && found.length > content.length) {
          content = found;
        }
      }

      return content || '详情请查看原文链接';
    } catch (error) {
      console.error('获取详情失败:', error.message);
      return '详情请查看原文链接';
    }
  }

  /**
   * 同步新闻到数据库
   * @param {number} daysWithin - 获取多少天内的新闻
   * @returns {Object} 同步结果
   */
  async syncNews(daysWithin = 2) {
    const results = {
      total: 0,
      added: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

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
        try {
          // 检查是否已存在（通过标题查重）
          const existing = await News.findOne({
            where: {
              title: news.title
            }
          });

          if (existing) {
            console.log(`⏭️ 跳过已存在: ${news.title}`);
            results.skipped++;
            results.details.push({ title: news.title, status: 'skipped', reason: '已存在' });
            continue;
          }

          // 获取详情内容
          const content = await this.fetchNewsContent(news.url);

          // 创建新闻
          await News.create({
            title: news.title,
            category: 'industry', // 政策文件归类为行业资讯
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

          // 添加延迟，避免请求过快
          await this.sleep(1000);

        } catch (err) {
          console.error(`❌ 处理失败: ${news.title}`, err.message);
          results.errors++;
          results.details.push({ title: news.title, status: 'error', reason: err.message });
        }
      }

      console.log(`\n📊 同步完成: 总计${results.total}条, 新增${results.added}条, 跳过${results.skipped}条, 失败${results.errors}条`);
      return results;

    } catch (error) {
      console.error('❌ 同步失败:', error);
      throw error;
    }
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new CrawlerService();
