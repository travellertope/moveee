const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://themoveee.com/shop', {waitUntil: 'networkidle0'});
  
  const rule = await page.evaluate(() => {
    const el = document.querySelector('.perk');
    const matched = [];
    if(el) {
       const rules = window.getMatchedCSSRules ? window.getMatchedCSSRules(el) : [];
       return "Need to parse stylesheets manually, or just look up display: grid in document.styleSheets";
    }
  });
  
  const gridCss = await page.evaluate(() => {
    let results = [];
    for(let sheet of Array.from(document.styleSheets)) {
      try {
        for(let rule of Array.from(sheet.cssRules)) {
          if (rule.cssText && rule.cssText.includes('.perk') && rule.cssText.includes('grid')) {
            results.push(rule.cssText);
          }
        }
      } catch(e) {}
    }
    return results;
  });
  
  console.log(gridCss);
  await browser.close();
})();
