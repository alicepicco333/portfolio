// Prints parts of Chromium's accessibility tree, to see what a screen reader would get.
// Usage: node probe-a11y-tree.js <node_modules dir>
const path = require('path');
const NM = process.argv[2] || 'C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules';
const { chromium } = require(path.join(NM, 'playwright'));
const BASE = process.env.BASE || ('https://alicepicco333.' + 'github.io/the-stolen-archive/'); // BASE=http://127.0.0.1:3003/ to test a local copy

function flat(node, depth = 0, out = []) {
  if (!node) return out;
  out.push('  '.repeat(depth) + `${node.role} "${(node.name || '').slice(0, 90)}"` + (node.pressed !== undefined ? ` pressed=${node.pressed}` : '') + (node.selected ? ' selected' : '') + (node.focused ? ' FOCUSED' : ''));
  (node.children || []).forEach((c) => flat(c, depth + 1, out));
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: 'a11y-audit-script (Playwright Chromium)' });
  const page = await ctx.newPage();
  const show = async (label, selector, max = 40) => {
    const h = await page.$(selector);
    if (!h) { console.log('--', label, 'not found'); return; }
    const snap = await page.accessibility.snapshot({ root: h, interestingOnly: false });
    const lines = flat(snap);
    console.log(`-- ${label} (${lines.length} nodes)`);
    console.log(lines.slice(0, max).join('\n'));
  };
  await page.goto(BASE + 'atlas.html', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  await show('atlas world map', '#atlas-map', 12);
  await show('atlas floor plan', '#floor-plan', 12);
  await show('atlas floor tabs', '.floor-switch', 12);
  await page.goto(BASE + 'collection.html', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await show('collection first card', '#collection-grid > li:first-child', 30);
  await show('collection filters', '.toolbar', 30);
  await page.goto(BASE + 'Object-page.html?no=1&tour=Timeline%20Tour&length=short&complexity=fun', { waitUntil: 'load' });
  await page.waitForTimeout(4000);
  await show('object tour bar', '.object-bar', 30);
  await show('object settings', '.tour-settings', 30);
  await show('object museum map', '#museum-map', 10);
  await show('object graph', '#graph2d', 20);
  await show('object deepdive', '#deepdive', 20);
  await show('object strip', '.object-strip', 8);
  await page.goto(BASE + 'index.html', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  await show('home eras', '.eras', 20);
  await show('home hero strip', '#hero-strip', 6);
  await show('home tours', '.tour-rows', 12);
  await page.goto(BASE + 'tours.html', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await show('tours prefs', '#preferences', 40);
  await browser.close();
})();
