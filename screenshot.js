const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto('http://localhost:4000/let-us-attend/', { waitUntil: 'networkidle0' });

  // Wait for initial render
  await new Promise(r => setTimeout(r, 500));

  // Place many tiles using Alt+N shortcut
  for (let i = 0; i < 100; i++) {
    await page.keyboard.down('Alt');
    await page.keyboard.press('KeyN');
    await page.keyboard.up('Alt');
    await new Promise(r => setTimeout(r, 20));
  }

  // Zoom in to verify no gaps
  for (let i = 0; i < 2; i++) {
    await page.keyboard.down('Meta');
    await page.keyboard.press('Equal');
    await page.keyboard.up('Meta');
    await new Promise(r => setTimeout(r, 100));
  }

  // Wait for tiles to render
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({ path: 'screenshot.png', fullPage: false });
  console.log('Screenshot saved to screenshot.png');

  await browser.close();
})();
