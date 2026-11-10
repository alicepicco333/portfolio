// Close-up of one map marker: not focused, then focused with Tab, to see the focus indicator.
// Usage: node probe-marker-ring.js <node_modules dir> <out dir>
const path = require('path');
const NM = process.argv[2] || 'C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules';
const OUTDIR = process.argv[3] || path.join(__dirname, '..', 'shots');
const { chromium } = require(path.join(NM, 'playwright'));
const BASE = 'https://alicepicco333.' + 'github.io/the-stolen-archive/';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 3, userAgent: 'a11y-audit-script (Playwright Chromium)' });
  const page = await ctx.newPage();
  await page.goto(BASE + 'atlas.html', { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  await page.evaluate(() => document.querySelector('#atlas-map').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);
  const target = await page.evaluate(() => { const m = [...document.querySelectorAll('#atlas-map .atlas-origin')][1]; const r = m.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, title: m.getAttribute('title') }; });
  const clip = { x: target.x - 40, y: target.y - 40, width: target.w + 80, height: target.h + 80 };
  await page.screenshot({ path: path.join(OUTDIR, 'F-map-marker-unfocused-closeup.png'), clip });
  await page.focus('#atlas-map');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => { const el = document.activeElement; const s = getComputedStyle(el); const a = getComputedStyle(el, '::after'); return { title: el.getAttribute('title'), outline: s.outline, afterBg: a.backgroundColor, afterShadow: a.boxShadow, cls: el.className }; });
  console.log(target.title, JSON.stringify(info));
  await page.screenshot({ path: path.join(OUTDIR, 'F-map-marker-focused-closeup.png'), clip });
  await browser.close();
})();
