/**
 * 分析详情页结构
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function analyze() {
  const url = 'https://www.zjzj.net/news/newsInfor/10/detailed/37014df09b020444019c0355a6bc0045';
  console.log('分析页面:', url);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // 保存HTML
  const html = await page.content();
  fs.writeFileSync(path.join(__dirname, '..', 'uploads', 'detail_page.html'), html);
  console.log('HTML已保存到 uploads/detail_page.html');
  
  // 分析结构
  const analysis = await page.evaluate(() => {
    const result = { possibleContentSelectors: [] };
    
    // 尝试各种选择器
    const selectors = [
      '.detail-content', '.article-content', '.news-content', 
      '.content-detail', '.main-content', '.news-detail',
      '.cont', '.text', '.info', '.detail', '.article',
      '#content', '#detail', '#article'
    ];
    
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.innerText.trim();
        result.possibleContentSelectors.push({
          selector: sel,
          textLength: text.length,
          preview: text.substring(0, 200)
        });
      }
    }
    
    // 查找可能的正文区域
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach(div => {
      const text = div.innerText.trim();
      if (text.includes('各有关单位和专家') && text.length < 3000) {
        result.correctContent = {
          className: div.className,
          id: div.id,
          textLength: text.length,
          preview: text.substring(0, 500)
        };
      }
    });
    
    return result;
  });
  
  console.log('\n分析结果:');
  console.log('可能的选择器:');
  analysis.possibleContentSelectors.forEach(s => {
    console.log(`  ${s.selector}: ${s.textLength}字符`);
    console.log(`    预览: ${s.preview.substring(0, 100)}...`);
  });
  
  if (analysis.correctContent) {
    console.log('\n找到正确内容区域:');
    console.log(`  class: ${analysis.correctContent.className}`);
    console.log(`  id: ${analysis.correctContent.id}`);
    console.log(`  长度: ${analysis.correctContent.textLength}`);
    console.log(`  预览: ${analysis.correctContent.preview}`);
  }
  
  await browser.close();
}

analyze().catch(console.error);
