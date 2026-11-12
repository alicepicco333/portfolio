// Measures the end of the home wall through the preview: wall box vs last tile, the fade, the end link.
const { chromium } = require('C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: +(process.argv[2] || 1440), height: 900 } })).newPage();
  await p.goto('http://127.0.0.1:5192/', { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(3000);
  await p.evaluate(async () => {
    for (let i = 0; i < 120 && !document.body.classList.contains('collage-done'); i++) {
      window.scrollBy(0, 600); await new Promise((r) => setTimeout(r, 250));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await p.waitForTimeout(1500);
  if (process.argv[3]) {
    await p.evaluate(() => { const a = document.querySelector('.collage-more'); window.scrollTo(0, a.getBoundingClientRect().top + scrollY - 700); });
    await p.waitForTimeout(2500);
    await p.screenshot({ path: process.argv[3] });
  }
  console.log(JSON.stringify(await p.evaluate(() => {
    const w = document.getElementById('hero-images');
    const tiles = [...w.querySelectorAll('.home-tile')];
    const wr = w.getBoundingClientRect();
    const lastBottom = Math.max(...tiles.map((t) => t.getBoundingClientRect().bottom));
    const link = document.querySelector('.collage-more a').getBoundingClientRect();
    const cs = getComputedStyle(w);
    return {
      tiles: tiles.length, done: document.body.classList.contains('collage-done'),
      wallBottomMinusLastTile: Math.round(wr.bottom - lastBottom),
      wallPaddingBottom: cs.paddingBottom, minHeight: w.style.minHeight, rows: cs.gridTemplateRows.split(' ').length,
      linkTopMinusLastTile: Math.round(link.top - lastBottom), mask: cs.maskImage || cs.webkitMaskImage,
      sentinel: Math.round(document.getElementById('hero-collage-sentinel').getBoundingClientRect().height),
    };
  })));
  await b.close();
})();
