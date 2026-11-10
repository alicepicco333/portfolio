// Follow-up probes: does a map marker show its pop-up when reached with Tab; where does focus go
// after Next in the middle of a tour and at its end; what does the page announce.
// Usage: node probe-focus-details.js <node_modules dir> <shots dir>
const path = require('path');
const NM = process.argv[2] || 'C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules';
const SHOTS = process.argv[3] || path.join(__dirname, '..', 'shots');
const { chromium } = require(path.join(NM, 'playwright'));
const BASE = process.env.BASE || ('https://alicepicco333.' + 'github.io/the-stolen-archive/'); // BASE=http://127.0.0.1:3003/ to test a local copy

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: 'a11y-audit-script (Playwright Chromium)' });
  const page = await ctx.newPage();

  // A. Atlas: Tab from the map container to the first marker
  await page.goto(BASE + 'atlas.html', { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  await page.focus('#atlas-map');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  const a = await page.evaluate(() => ({ focused: document.activeElement.getAttribute('title'), popVisible: [...document.querySelectorAll('.atlas-pop')].some((p) => !p.hidden), listHighlighted: document.querySelector('.atlas-list a.is-active')?.textContent.replace(/\s+/g, ' ').trim() || null }));
  console.log('A marker via Tab:', JSON.stringify(a));
  await page.screenshot({ path: path.join(SHOTS, 'p-atlas-marker-tab.png') });

  // B. Object page: Next in the middle of a tour
  await page.goto(BASE + 'Object-page.html?no=1&tour=Timeline%20Tour&length=short&complexity=fun', { waitUntil: 'load' });
  await page.waitForTimeout(4000);
  await page.focus('#next');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  const b = await page.evaluate(() => ({ h1: document.getElementById('item-title').textContent, focused: document.activeElement.id || document.activeElement.tagName, url: location.search, progress: document.getElementById('tour-progress').getAttribute('aria-valuetext') }));
  console.log('B next mid-tour:', JSON.stringify(b));

  // C. Object page: go to the last object of the tour, then press Next on the one before it
  const total = await page.evaluate(() => document.querySelectorAll('#object-strip button').length);
  await page.click(`#object-strip li:nth-child(${total - 1}) button`);
  await page.waitForTimeout(1500);
  await page.focus('#next');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  const c = await page.evaluate(() => ({ h1: document.getElementById('item-title').textContent, focused: document.activeElement.id || document.activeElement.tagName, nextDisabled: document.getElementById('next').disabled }));
  console.log('C next to last object:', JSON.stringify(c));

  // D. Tour switch on the object page: are the reading choices kept?
  await page.goto(BASE + 'Object-page.html?no=5&tour=Timeline%20Tour&length=long&complexity=expert', { waitUntil: 'load' });
  await page.waitForTimeout(4000);
  await page.click('#geo-button');
  await page.waitForTimeout(4000);
  const d = await page.evaluate(() => ({ h1: document.getElementById('item-title').textContent, stored: localStorage.getItem('tourData'), pressed: [...document.querySelectorAll('[data-length][aria-pressed=true],[data-complexity][aria-pressed=true]')].map((x) => x.textContent.trim()) }));
  console.log('D switch tour:', JSON.stringify(d));

  // E. Collection: filter buttons announce the count?
  await page.goto(BASE + 'collection.html', { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.click('button[data-filter="Oceania"]');
  await page.waitForTimeout(500);
  const e = await page.evaluate(() => ({ count: document.getElementById('collection-count').textContent, pressed: [...document.querySelectorAll('[data-filter]')].map((x) => x.textContent.trim() + '=' + x.getAttribute('aria-pressed')).join(' ') }));
  console.log('E filter:', JSON.stringify(e));
  await browser.close();
})();
