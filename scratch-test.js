const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://themoveee.com/shop', {waitUntil: 'networkidle2'});
  
  const styles = await page.evaluate(() => {
    const perk = document.querySelector('.perk');
    const desc = document.querySelector('.pk-desc');
    const title = document.querySelector('.pk-title');
    const icon = document.querySelector('.pk-icon');
    
    return {
      perkBox: perk ? perk.getBoundingClientRect() : null,
      descBox: desc ? desc.getBoundingClientRect() : null,
      descStyle: desc ? {
        width: window.getComputedStyle(desc).width,
        display: window.getComputedStyle(desc).display,
        whiteSpace: window.getComputedStyle(desc).whiteSpace,
        wordBreak: window.getComputedStyle(desc).wordBreak,
        overflowWrap: window.getComputedStyle(desc).overflowWrap,
        maxWidth: window.getComputedStyle(desc).maxWidth,
        padding: window.getComputedStyle(desc).padding,
        margin: window.getComputedStyle(desc).margin
      } : null,
      titleBox: title ? title.getBoundingClientRect() : null,
      iconBox: icon ? icon.getBoundingClientRect() : null,
      descHTML: desc ? desc.innerHTML : null
    };
  });
  
  console.log(JSON.stringify(styles, null, 2));
  await browser.close();
})();
