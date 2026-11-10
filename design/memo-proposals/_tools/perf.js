// Frame timing for B's rearrangement (5,000 squares moving) and A's swipe drag.
const { chromium } = require('C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:5191';
const sample = () => new Promise(res => {
  const t = []; const s = performance.now();
  (function f(n) { t.push(n); if (n - s < 1300) requestAnimationFrame(f); else {
    const d = t.slice(1).map((x, i) => x - t[i]);
    res({ frames: d.length, avg: +(d.reduce((a, b) => a + b, 0) / d.length).toFixed(1), worst: +Math.max(...d).toFixed(1), over20: d.filter(x => x > 20).length });
  } })(performance.now());
});
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`${BASE}/B/index.html`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const run = p.evaluate(sample);
  await p.click('#arrange button[data-a="colour"]');
  console.log('B rearrange (year to colour):', await run);
  await p.goto(`${BASE}/A/index.html`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const box = await p.locator('#cmp').boundingBox();
  const run2 = p.evaluate(sample);
  await p.mouse.move(box.x + 100, box.y + 200); await p.mouse.down();
  for (let i = 0; i < 60; i++) { await p.mouse.move(box.x + 100 + i * 11, box.y + 200); }
  await p.mouse.up();
  console.log('A swipe drag:', await run2);
  await b.close();
})();
