// Finds text in the documentation page that runs past a 320 px viewport outside any scroll container.
// Usage: node probe-doc-320.js <node_modules dir> <shots dir>
const path = require('path');
const NM = process.argv[2] || 'C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules';
const SHOTS = process.argv[3] || path.join(__dirname, '..', 'shots');
const { chromium } = require(path.join(NM, 'playwright'));
const BASE = 'https://alicepicco333.' + 'github.io/the-stolen-archive/';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, userAgent: 'a11y-audit-script (Playwright Chromium)', deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE + 'documentation.html', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const scrolls = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') return p.tagName + '.' + p.className; } return null; };
    return [...document.querySelectorAll('code, a, td, p, li')].filter((c) => { const r = c.getBoundingClientRect(); return r.width > 0 && r.right > W + 1; }).map((c) => ({ tag: c.tagName, text: c.textContent.slice(0, 60), right: Math.round(c.getBoundingClientRect().right), scroller: scrolls(c), details: c.closest('details')?.id, open: c.closest('details')?.open, y: Math.round(c.getBoundingClientRect().top + scrollY) }));
  });
  console.log(JSON.stringify(info.filter((i) => !i.scroller).slice(0, 10), null, 1));
  console.log('inside scroll containers:', info.filter((i) => i.scroller).length);
  const first = info.find((i) => !i.scroller);
  if (first) {
    await page.evaluate((y) => window.scrollTo(0, y - 200), first.y);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SHOTS, 'F-documentation-320px-cut-off.png') });
  }
  await browser.close();
})();
