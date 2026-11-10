// Reduced motion and keyboard only: Tab to Start, play with keys, Tab to a glow and point with Enter, open and close the help.
//   node design/junior-sim/test-a11y.cjs <playwright module path> <url> <out dir>
const [pwPath, url, out] = process.argv.slice(2);
const { chromium } = require(pwPath);
const path = require('path');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => !document.getElementById('startbtn').disabled, null, { timeout: 120000 });
  // keyboard only: Tab until Start has focus, press Enter
  for (let i = 0; i < 6; i++) { if (await page.evaluate(() => document.activeElement?.id) === 'startbtn') break; await page.keyboard.press('Tab'); }
  console.log('focus before start:', await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName));
  await page.keyboard.press('Enter'); await wait(600);
  console.log('dialog open after Enter:', await page.evaluate(() => document.getElementById('intro').open));
  // drive with keys, camera follows rigidly with reduced motion
  await page.keyboard.down('ArrowUp'); await page.keyboard.down('ArrowLeft'); await wait(1200);
  const hud = await page.textContent('#gesture') + ' / ' + await page.textContent('#gesturesub');
  await page.keyboard.up('ArrowLeft'); await page.keyboard.up('ArrowUp');
  console.log('HUD while driving:', hud);
  // Tab to the first glow target and point at it with Enter
  let label = '';
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); label = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent.trim()); if (/Point at the glow/.test(label)) break; }
  console.log('focused:', label);
  await page.keyboard.press('Enter'); await wait(200);
  console.log('heard:', await page.textContent('#heard'));
  await page.screenshot({ path: path.join(out, 'a1-keyboard-point.png') });
  // the flare with reduced motion: a steady, softer brightening
  await page.keyboard.press('f'); await wait(300);
  console.log('flash opacity (reduced motion):', await page.evaluate(() => getComputedStyle(document.getElementById('flash')).opacity));
  // help: open with the ? button via keyboard, close with Escape
  await page.focus('#helpbtn'); await page.keyboard.press('Enter'); await wait(200);
  const open = await page.evaluate(() => document.getElementById('intro').open);
  const t1 = await page.evaluate(() => window.sim.S.now); await wait(500); const t2 = await page.evaluate(() => window.sim.S.now);
  await page.keyboard.press('Escape'); await wait(300);
  console.log('help open:', open, '| sim paused while open:', t1 === t2, '| closed with Esc:', !(await page.evaluate(() => document.getElementById('intro').open)), '| focus back on:', await page.evaluate(() => document.activeElement?.id));
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
