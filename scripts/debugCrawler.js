/**
 * 调试脚本 - 查看浙江造价网页面结构
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function debug() {
  console.log('🔍 调试模式 - 分析页面结构...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ],
    ignoreHTTPSErrors: true
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
  
  try {
    const url = 'https://www.zjzj.net/news/newsInfor/10';
    console.log(`📄 访问: ${url}\n`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // 截图
    const screenshotPath = path.join(__dirname, '..', 'uploads', 'debug_screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 截图已保存: ${screenshotPath}\n`);
    
    // 获取页面HTML
    const html = await page.content();
    const htmlPath = path.join(__dirname, '..', 'uploads', 'debug_page.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`📝 HTML已保存: ${htmlPath}\n`);
    
    // 分析页面结构
    const analysis = await page.evaluate(() => {
      const result = {
        title: document.title,
        url: window.location.href,
        possibleNewsSelectors: []
      };
      
      // 尝试各种可能的选择器
      const selectors = [
        '.news-ul a', '.news-list a', '.list-item a',
        '.article-list a', '.news a', 'ul li a',
        '.content a', '.main a', '[class*="news"] a',
        '[class*="list"] a', '[class*="item"] a'
      ];
      
      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) {
          result.possibleNewsSelectors.push({
            selector: sel,
            count: els.length,
            samples: Array.from(els).slice(0, 3).map(el => ({
              text: el.textContent?.trim().substring(0, 50),
              href: el.getAttribute('href')
            }))
          });
        }
      }
      
      // 查找所有包含日期的元素
      const datePatterns = document.body.innerHTML.match(/\d{4}[-/.]\d{2}[-/.]\d{2}/g);
      result.datesFound = datePatterns ? [...new Set(datePatterns)].slice(0, 10) : [];
      
      return result;
    });
    
    console.log('📊 页面分析结果:\n');
    console.log(`标题: ${analysis.title}`);
    console.log(`URL: ${analysis.url}`);
    console.log(`\n找到的日期: ${analysis.datesFound.join(', ')}\n`);
    
    console.log('可能的新闻选择器:');
    for (const sel of analysis.possibleNewsSelectors) {
      console.log(`\n  ${sel.selector} (${sel.count}个元素)`);
      for (const sample of sel.samples) {
        console.log(`    - ${sample.text}... -> ${sample.href}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
    console.log('\n🔒 浏览器已关闭');
  }
}

debug();
