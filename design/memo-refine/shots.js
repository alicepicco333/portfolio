// Before/after screenshots of the live Meme Ontology site with memo-refine.css injected.
// Nothing is copied or edited: the live pages load as they are and, for "after", the stylesheet is added on top
// with page.addStyleTag once the page has loaded.
//
// Usage (from any folder):
//   node shots.js                      -> before and after, every page
//   node shots.js before               -> only the live site as it is
//   node shots.js after                -> only the live site with memo-refine.css
//   node shots.js after home,thesis    -> some pages only
//
// Pages: home, visualizations, thesis, sparql (the four asked for) and the three in-page views of the
// visualizations app that share the same stylesheet: dataset, ontology, about.
//
// Output: shots/<mode>/<page>-1440x900.png      first screen, desktop
//         shots/<mode>/<page>-1440x900-full.png full page, desktop (thesis: the first 12,000 px, the whole
//                                               reader is about 111,000 px tall)
//         shots/<mode>/<page>-390x844.png       first screen, phone

const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright');

const BASE = 'https://thememeontology.netlify.app';
const HERE = __dirname;
const CSS = fs.readFileSync(path.join(HERE, 'memo-refine.css'), 'utf8');

const PAGES = {
  home: '/',
  visualizations: '/visualizations',
  thesis: '/thesis',
  sparql: '/sparql',
  dataset: '/visualizations#dataset',
  ontology: '/visualizations#ontology',
  about: '/visualizations#about',
};
const VIEWPORTS = [
  { w: 1440, h: 900, full: true },
  { w: 390, h: 844, full: false },
];
const FULL_CLIP = { thesis: 12000 };

const modes = process.argv[2] && process.argv[2] !== 'all' ? [process.argv[2]] : ['before', 'after'];
const only = process.argv[3] ? process.argv[3].split(',') : Object.keys(PAGES);

// Walk down the page so lazy images load and the charts that draw on first view get drawn, then go back up.
async function settle(page, limit) {
  await page.evaluate(async (max) => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const end = Math.min(document.documentElement.scrollHeight, max || Infinity);
    for (let y = 0; y < end; y += Math.round(window.innerHeight * 0.6)) {
      window.scrollTo(0, y);
      await wait(700);
    }
    window.scrollTo(0, 0);
  }, limit);
  await page.waitForTimeout(2000);
}

async function load(page, name, mode) {
  await page.goto(BASE + PAGES[name], { waitUntil: 'networkidle', timeout: 90000 });
  if (mode === 'after') {
    await page.addStyleTag({ content: CSS });
    // Charts drawn at load measured their boxes before the stylesheet arrived; let them measure again,
    // as they would if the rules were in the site's own stylesheet.
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  }
  await page.waitForTimeout(1800);
}

// The in-page views (dataset, ontology, about) scroll inside a fixed panel, so a full-page capture of the
// window shows only the first screen. For those, grow the window to the panel's height for one capture.
async function innerHeight(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.page:not(.hidden)');
    return el ? el.scrollHeight : 0;
  });
}

(async () => {
  const browser = await chromium.launch();
  for (const mode of modes) {
    const dir = path.join(HERE, 'shots', mode);
    fs.mkdirSync(dir, { recursive: true });
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.w, height: vp.h },
        deviceScaleFactor: 1,
        userAgent: 'memo-design-study',
      });
      const page = await ctx.newPage();
      for (const name of only) {
        if (!PAGES[name]) continue;
        const tag = `${name}-${vp.w}x${vp.h}`;
        try {
          await load(page, name, mode);
          await page.screenshot({ path: path.join(dir, `${tag}.png`) });
          if (vp.full) {
            const inner = await innerHeight(page);
            if (inner > vp.h) {
              await page.setViewportSize({ width: vp.w, height: Math.min(inner + 48, 9000) });
              await page.waitForTimeout(2500);
              await page.screenshot({ path: path.join(dir, `${tag}-full.png`) });
              await page.setViewportSize({ width: vp.w, height: vp.h });
            } else {
              await settle(page, FULL_CLIP[name]);
              const opts = { path: path.join(dir, `${tag}-full.png`), fullPage: true };
              if (FULL_CLIP[name]) opts.clip = { x: 0, y: 0, width: vp.w, height: FULL_CLIP[name] };
              await page.screenshot(opts);
            }
          }
          console.log('ok', mode, tag);
        } catch (e) {
          console.log('fail', mode, tag, e.message.slice(0, 160));
        }
      }
      await ctx.close();
    }
  }
  await browser.close();
})();
