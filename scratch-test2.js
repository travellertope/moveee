const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://themoveee.com/shop', {waitUntil: 'networkidle0'});
  
  const ok = await page.evaluate(() => document.querySelector('.mb-left') !== null);
  if (!ok) {
    console.log("No mb-left found!");
  }
  
  const dims = await page.evaluate(() => {
    const parent = document.querySelector('.mb-left');
    const p1 = document.querySelector('.mb-left p');
    const perksContainer = document.querySelector('.mb-perks');
    const perk = document.querySelector('.perk');
    const desc = document.querySelector('.pk-desc');
    
    function rect(el) {
      if(!el) return null;
      const r = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
         width: r.width, 
         display: style.display, 
         flexBasis: style.flexBasis, 
         boxSizing: style.boxSizing, 
         flexShrink: style.flexShrink,
         flexGrow: style.flexGrow,
         maxWidth: style.maxWidth,
         minWidth: style.minWidth
      };
    }
    
    return {
      parent: rect(parent),
      introP: rect(p1),
      perksContainer: rect(perksContainer),
      perk: rect(perk),
      desc: rect(desc)
    };
  });
  
  console.log(JSON.stringify(dims, null, 2));
  await browser.close();
})();
