// Extra probes: forced colours (Windows high contrast emulation), light-theme highlight contrast
// in the Atlas list, keyboard zoom in the photo viewer.
// Usage: node probe-extra.js <node_modules dir> <shots dir>
const path = require('path');
const NM = process.argv[2] || 'C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules';
const SHOTS = process.argv[3] || path.join(__dirname, '..', 'shots');
const { chromium } = require(path.join(NM, 'playwright'));
const BASE = process.env.BASE || ('https://alicepicco333.' + 'github.io/the-stolen-archive/'); // BASE=http://127.0.0.1:3003/ to test a local copy
const UA = 'a11y-audit-script (Playwright Chromium)';
const OBJ = 'Object-page.html?no=8&tour=Colonial%20Conquests%20Tour&length=medium&complexity=basic';

(async () => {
  const browser = await chromium.launch();

  // 1. forced colours: pressed buttons and the selected tab still distinguishable?
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA, forcedColors: 'active', colorScheme: 'dark' });
    const page = await ctx.newPage();
    await page.goto(BASE + OBJ, { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    const bar = await page.$('.object-bar');
    await bar.screenshot({ path: path.join(SHOTS, 'probe-forced-colors-tour-bar.png') });
    const set = await page.$('.tour-settings');
    await set.screenshot({ path: path.join(SHOTS, 'F-forced-colours-pressed-state-lost.png') });
    const styles = await page.evaluate(() => [...document.querySelectorAll('#length-controls button')].map((b) => ({ t: b.textContent, pressed: b.getAttribute('aria-pressed'), bg: getComputedStyle(b).backgroundColor, color: getComputedStyle(b).color, border: getComputedStyle(b).borderStyle + ' ' + getComputedStyle(b).borderWidth })));
    console.log('forced colours, length buttons:', JSON.stringify(styles));
    await page.goto(BASE + 'index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.evaluate(() => document.querySelector('.eras').scrollIntoView());
    await page.waitForTimeout(800);
    const tabs = await page.$('#era-tabs');
    await tabs.screenshot({ path: path.join(SHOTS, 'probe-forced-colors-era-tabs.png') });
    await ctx.close();
  }

  // 2. light theme: Atlas list item highlighted on focus (vermilion title on raised background)
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
    const page = await ctx.newPage();
    await page.goto(BASE + 'atlas.html', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    await page.focus('#atlas-list a');
    await page.waitForTimeout(300);
    const s = await page.evaluate(() => { const a = document.activeElement; const t = a.querySelector('.atlas-list__title'); return { cls: a.className, titleColor: getComputedStyle(t).color, linkBg: getComputedStyle(a).backgroundColor, fontSize: getComputedStyle(t).fontSize, weight: getComputedStyle(t).fontWeight }; });
    console.log('light atlas list focus:', JSON.stringify(s));
    await ctx.close();
  }

  // 3. photo viewer: can the keyboard zoom the photo?
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
    const page = await ctx.newPage();
    await page.goto(BASE + OBJ, { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    await page.focus('#gallery-enlarge');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const before = await page.evaluate(() => document.getElementById('expandedImg').style.transform);
    for (const k of ['+', '=', 'Control+=', 'ArrowUp']) { await page.keyboard.press(k); await page.waitForTimeout(150); }
    const after = await page.evaluate(() => document.getElementById('expandedImg').style.transform);
    const zoomButtons = await page.evaluate(() => document.querySelectorAll('#imageModal button').length);
    console.log('lightbox transform before/after keys:', before, '|', after, '| buttons in viewer:', zoomButtons);
    await ctx.close();
  }
  await browser.close();
})();
