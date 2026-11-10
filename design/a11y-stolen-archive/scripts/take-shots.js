// Screenshots of rendered pages for the main findings (never of anyone's screen).
// Re-run after fixes to get the "after" pictures for the case study.
// Usage: node take-shots.js <node_modules dir> <shots dir>
const path = require('path');
const fs = require('fs');
const NM = process.argv[2] || 'C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules';
const SHOTS = process.argv[3] || path.join(__dirname, '..', 'shots');
const { chromium } = require(path.join(NM, 'playwright'));
const BASE = 'https://alicepicco333.' + 'github.io/the-stolen-archive/';
const UA = 'a11y-audit-script (Playwright Chromium)';

async function clipAround(page, selector, file, pad = 24) {
  const el = await page.$(selector);
  const b = await el.boundingBox();
  const vp = page.viewportSize();
  const x = Math.max(0, b.x - pad); const y = Math.max(0, b.y - pad);
  await page.screenshot({ path: path.join(SHOTS, file), clip: { x, y, width: Math.min(vp.width - x, b.width + pad * 2), height: Math.min(vp.height - y, b.height + pad * 2) } });
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();

  // F-lightbox: Tab moves out of the open photo viewer to links hidden behind it
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
    const page = await ctx.newPage();
    await page.goto(BASE + 'Object-page.html?no=8&tour=Colonial%20Conquests%20Tour&length=medium&complexity=basic', { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    await page.focus('#gallery-enlarge');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(80); }
    const where = await page.evaluate(() => document.activeElement.textContent.trim());
    console.log('lightbox focus after 6 Tabs:', where);
    await page.screenshot({ path: path.join(SHOTS, 'F-lightbox-focus-behind-dialog.png') });
    await ctx.close();
  }

  // F-map-markers: a marker reached with Tab (ring, no name shown) and the same marker on hover (name shown)
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
    const page = await ctx.newPage();
    await page.goto(BASE + 'atlas.html', { waitUntil: 'load' });
    await page.waitForTimeout(3500);
    await page.evaluate(() => document.querySelector('#atlas-map').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(500);
    await page.focus('#atlas-map');
    for (let i = 0; i < 3; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(150); }
    const t = await page.evaluate(() => document.activeElement.getAttribute('title'));
    console.log('focused marker:', t);
    const box = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { x: r.left, y: r.top }; });
    const clip = { x: Math.max(0, box.x - 200), y: Math.max(0, box.y - 160), width: 400, height: 300 };
    await page.screenshot({ path: path.join(SHOTS, 'F-map-marker-keyboard-focus.png'), clip });
    await page.evaluate(() => document.activeElement.blur());
    await page.mouse.move(box.x + 12, box.y + 12);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, 'F-map-marker-mouse-hover.png'), clip });
    await ctx.close();
  }

  // F-light-contrast: reading preferences summary in the light theme
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
    const page = await ctx.newPage();
    await page.goto(BASE + 'tours.html', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await clipAround(page, '#prefs-summary', 'F-light-theme-summary-contrast.png', 40);
    await ctx.close();
  }

  // F-progress: the tour position is a 3 px bar on a faint track, with no number on screen
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
    const page = await ctx.newPage();
    await page.goto(BASE + 'Object-page.html?no=12&tour=Timeline%20Tour&length=short&complexity=fun', { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    await clipAround(page, '.object-bar', 'F-tour-progress-bar.png', 8);
    await ctx.close();
  }

  // F-floor-dots: faint object dots on the floor plan (light theme, where they are faintest)
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
    const page = await ctx.newPage();
    await page.goto(BASE + 'Object-page.html?no=1&tour=Timeline%20Tour&length=short&complexity=fun', { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    await page.evaluate(() => document.querySelector('#museum-map').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(800);
    await clipAround(page, '#museum-map', 'F-floor-plan-dots-light.png', 8);
    await ctx.close();
  }

  // F-reflow: a long file name in the documentation is cut off at 320 px and cannot be scrolled to
  {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, userAgent: UA, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(BASE + 'documentation.html', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
    const found = await page.evaluate(() => {
      const c = [...document.querySelectorAll('code')].find((x) => x.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && !x.closest('pre'));
      if (!c) return null; c.scrollIntoView({ block: 'center' }); return c.textContent;
    });
    console.log('cut-off code:', found);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, 'F-documentation-320px-cut-off.png') });
    await ctx.close();
  }

  // W-skip-link: what already works, the skip link on first Tab
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
    const page = await ctx.newPage();
    await page.goto(BASE + 'index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS, 'W-skip-link-first-tab.png'), clip: { x: 0, y: 0, width: 640, height: 160 } });
    await ctx.close();
  }
  await browser.close();
})();
