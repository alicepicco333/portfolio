// Live preview: opens the real site in a browser window with memo-refine.css added to every page you visit,
// so the hover states, the Arrange control, the thesis index and the SPARQL editor can be tried by hand.
// Alt+Shift+R switches the refinement off and on, to compare with the site as it is.
//
//   node preview.js                 -> opens the home page
//   node preview.js thesis          -> opens /thesis (any path of the site)
//
// Nothing is saved or sent anywhere; close the window to stop.

const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright');

const CSS = fs.readFileSync(path.join(__dirname, 'memo-refine.css'), 'utf8');
const start = 'https://thememeontology.netlify.app/' + (process.argv[2] || '').replace(/^\//, '');
const test = process.env.PREVIEW_TEST === '1';

(async () => {
  const browser = await chromium.launch({ headless: test, args: test ? [] : ['--start-maximized'] });
  const ctx = await browser.newContext({ viewport: test ? { width: 1440, height: 900 } : null, userAgent: 'memo-design-study' });
  await ctx.addInitScript((css) => {
    const add = () => {
      if (document.getElementById('memo-refine')) return;
      const s = document.createElement('style');
      s.id = 'memo-refine';
      s.textContent = css;
      document.head.appendChild(s);
      window.dispatchEvent(new Event('resize'));
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
    else add();
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && e.code === 'KeyR') {
        const s = document.getElementById('memo-refine');
        if (s) { s.disabled = !s.disabled; window.dispatchEvent(new Event('resize')); }
      }
    });
  }, CSS);
  const page = await ctx.newPage();
  await page.goto(start, { waitUntil: 'domcontentloaded' });

  if (test) {
    await page.waitForLoadState('networkidle');
    const on = await page.evaluate(() => !!document.getElementById('memo-refine') && getComputedStyle(document.querySelector('.topnav')).borderBottomWidth);
    await page.keyboard.press('Alt+Shift+R');
    const off = await page.evaluate(() => getComputedStyle(document.querySelector('.topnav')).borderBottomWidth);
    console.log('nav rule with refinement:', on, '| switched off:', off);
    await browser.close();
    return;
  }
  console.log('Preview open on', start, '(Alt+Shift+R compares with the live site). Close the window to stop.');
  browser.on('disconnected', () => process.exit(0));
})();
