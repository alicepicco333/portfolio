// Runs axe-core on a sample of The Stolen Archive pages, in the dark theme (default)
// and the light theme, and writes ../axe-results.json.
// Usage: node run-axe.js <node_modules dir with playwright and axe-core>
// No personal data in requests: plain project User-Agent, no logins, no forms sent.
const path = require('path');
const fs = require('fs');
const NM = process.argv[2] || 'C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules';
const { chromium } = require(path.join(NM, 'playwright'));
const AXE_PATH = path.join(NM, 'axe-core', 'axe.min.js');
const AXE_VERSION = require(path.join(NM, 'axe-core', 'package.json')).version;
const PW_VERSION = require(path.join(NM, 'playwright', 'package.json')).version;

const BASE = process.env.BASE || ('https://alicepicco333.' + 'github.io/the-stolen-archive/'); // BASE=http://127.0.0.1:3003/ to test a local copy
const OUT = process.env.OUT || path.join(__dirname, '..', 'axe-results.json');

// id, path, optional setup step run after load
const SAMPLE = [
  { id: 'home', path: 'index.html' },
  { id: 'collection-grid', path: 'collection.html' },
  { id: 'collection-index', path: 'collection.html', setup: async (p) => { await p.click('button[data-view="table"]'); } },
  { id: 'tours', path: 'tours.html' },
  { id: 'atlas-floor1', path: 'atlas.html' },
  { id: 'atlas-floor2', path: 'atlas.html', setup: async (p) => { await p.click('button[role="tab"][data-floor="2"]'); } },
  { id: 'tour-step-timeline-01', path: 'Object-page.html?tour=Timeline%20Tour&length=short&complexity=fun', object: true },
  { id: 'object-001-benin', path: 'Object-page.html?no=1&tour=Timeline%20Tour&length=short&complexity=fun', object: true },
  { id: 'object-008-glele', path: 'Object-page.html?no=8&tour=Colonial%20Conquests%20Tour&length=medium&complexity=basic', object: true },
  { id: 'object-024-kalaniopuu', path: 'Object-page.html?no=24&tour=Geo%20Tour&length=long&complexity=expert', object: true },
  { id: 'about', path: 'about.html' },
  { id: 'documentation-open', path: 'documentation.html', setup: async (p) => { await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; })); } },
];

async function revealAll(page) {
  // scroll the whole page so [data-reveal] sections fade in, then back to the top
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
}

(async () => {
  const browser = await chromium.launch();
  const results = {
    tool: { axe: AXE_VERSION, playwright: PW_VERSION, browser: 'Chromium ' + browser.version() },
    runAt: new Date().toISOString(),
    base: BASE,
    tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
    viewport: { width: 1280, height: 900 },
    pages: [],
  };
  for (const theme of ['dark', 'light']) {
    for (const s of SAMPLE) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: 'a11y-audit-script (Playwright Chromium)' });
      if (theme === 'light') await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
      const page = await ctx.newPage();
      const consoleErrors = [];
      const failed = [];
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
      page.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
      page.on('requestfailed', (r) => failed.push('failed ' + r.url()));
      try {
        await page.goto(BASE + s.path, { waitUntil: 'load', timeout: 60000 });
        await page.waitForTimeout(2500);
        if (s.object) await page.waitForFunction(() => document.getElementById('item-title')?.textContent.trim().length > 0, null, { timeout: 30000 });
        if (s.setup) { await s.setup(page); await page.waitForTimeout(800); }
        await revealAll(page);
        await page.addScriptTag({ path: AXE_PATH });
        const r = await page.evaluate(async (tags) => {
          // eslint-disable-next-line no-undef
          return await axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations', 'incomplete'] });
        }, results.tags);
        results.pages.push({
          id: s.id, theme, url: BASE + s.path, title: await page.title(), lang: await page.evaluate(() => document.documentElement.lang),
          testedAt: r.timestamp,
          violations: r.violations,
          incomplete: r.incomplete,
          passes: r.passes.map((x) => x.id), // rule ids only (resultTypes keeps one node per passed rule)
          inapplicable: r.inapplicable.map((x) => x.id),
          consoleErrors, failedRequests: failed,
        });
        console.log(theme, s.id, 'violations:', r.violations.map((v) => `${v.id}(${v.nodes.length})`).join(' ') || 'none', '| incomplete:', r.incomplete.map((v) => `${v.id}(${v.nodes.length})`).join(' ') || 'none');
      } catch (e) {
        results.pages.push({ id: s.id, theme, url: BASE + s.path, error: String(e) });
        console.log(theme, s.id, 'ERROR', String(e).slice(0, 200));
      }
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  console.log('wrote', OUT);
})();
