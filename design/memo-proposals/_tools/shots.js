// Renders the mockups at 1440x900 and 390x844 into <dir>/shots/.
// Run with the static server up: node shots.js [base-url]
const { chromium } = require('C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BASE = process.argv[2] || 'http://127.0.0.1:5191';
const PAGES = [
  ['A', 'home', 'A/index.html'],
  ['A', 'inner-matrix', 'A/variants.html'],
  ['B', 'home', 'B/index.html'],
  ['B', 'inner-time', 'B/time.html'],
  ['C', 'home', 'C/index.html?still'],
  ['C', 'inner-thesis', 'C/thesis.html?at'],
];
const SIZES = [[1440, 900], [390, 844]];
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of SIZES) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    for (const [dir, name, url] of PAGES) {
      await p.goto(`${BASE}/${url}`, { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(1200);
      const out = path.join(ROOT, dir, 'shots', `${name}-${w}x${h}.png`);
      await p.screenshot({ path: out });
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      console.log('ok', dir, name, `${w}x${h}`, overflow > 0 ? `HORIZONTAL OVERFLOW ${overflow}px` : '');
    }
    if (errs.length) console.log('errors:', [...new Set(errs)].join(' | '));
    await ctx.close();
  }
  await b.close();
})();
