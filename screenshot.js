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

  // Collect tiles directly via JS
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('let-us-attend'));
    if (state && state.tiles) {
      // Mark first 30 tiles as collected
      for (let i = 0; i < Math.min(30, state.tiles.length); i++) {
        state.tiles[i].isCollected = true;
        state.tiles[i].collected = new Date().toISOString();
        delete state.tiles[i].placedAt;
      }
      localStorage.setItem('let-us-attend', JSON.stringify(state));
    }
  });

  // Reload to apply changes
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  // Zoom in via JS
  await page.evaluate(() => {
    if (typeof viewportState !== 'undefined') {
      viewportState.zoom = 1.5;
    }
  });
  await new Promise(r => setTimeout(r, 200));

  // Wait for tiles to render
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({ path: 'screenshot.png', fullPage: false });
  console.log('Screenshot saved to screenshot.png');

  await browser.close();
})();
