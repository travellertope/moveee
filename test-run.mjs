import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000/shop', {waitUntil: 'networkidle2'}).catch(e => console.log("Can't hit local, hitting prod instead"));
  
  const ok = await page.evaluate(() => document.querySelector('.mb-left') !== null);
  if (!ok) {
    await page.goto('https://themoveee.com/shop', {waitUntil: 'networkidle2'});
  }
  
  const dims = await page.evaluate(() => {
    const el = document.querySelector('.mb-left');
    const right = document.querySelector('.mb-right');
    const perks = document.querySelector('.mb-perks');
    const p1 = document.querySelector('.perk:first-child');
    return {
      left: el ? el.getBoundingClientRect().width : null,
      right: right ? right.getBoundingClientRect().width : null,
      perks: perks ? perks.getBoundingClientRect().width : null,
      p1: p1 ? p1.getBoundingClientRect().width : null,
      p1Text: p1 ? p1.innerText : null
    };
  });
  
  console.log(JSON.stringify(dims, null, 2));
  await browser.close();
})();
