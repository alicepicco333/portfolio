// Drives the browser Junior headless and saves screenshots: start, keys, squeeze, check that one, come back, flare.
//   node design/junior-sim/test-sim.cjs <playwright module path> <url> <out dir> [width] [height]
const [pwPath, url, out, W = '1440', H = '900'] = process.argv.slice(2);
const { chromium } = require(pwPath);
const fs = require('fs');
const path = require('path');
fs.mkdirSync(out, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(out, '0-loading.png') });
  await page.waitForFunction(() => !document.getElementById('startbtn').disabled, null, { timeout: 120000 });
  console.log('loaded in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  await page.screenshot({ path: path.join(out, '1-intro.png') });
  await page.click('#startbtn');
  await wait(1500);
  const state = () => page.evaluate(() => {
    const s = window.sim, j = s.W.junior;
    return { x: +j.position.x.toFixed(2), z: +j.position.z.toFixed(2), h: +(j.rotation.y * 180 / Math.PI).toFixed(0), drive: s.S.drive, pilot: s.pilot.name, why: s.pilot.why,
      view: s.S.view, blocked: s.S.blocked, glows: s.g.glow_blobs.map(b => `${b.id}:${b.at}:${b.strength}:a${b.area}:d${b.dist.toFixed(2)}`),
      said: document.getElementById('said').textContent, verdict: document.getElementById('verdict').textContent, wheels: s.W.wheelPivots.length };
  });
  console.log('start', JSON.stringify(await state()));
  await page.screenshot({ path: path.join(out, '2-start.png') });
  // squeeze
  await page.keyboard.press('v');
  await wait(1200);
  console.log('squeeze', JSON.stringify(await state()));
  await page.screenshot({ path: path.join(out, '3-squeeze.png') });
  // drive forward a little with the keys
  await page.keyboard.down('ArrowUp'); await wait(1500); await page.keyboard.up('ArrowUp');
  await wait(300);
  console.log('drove', JSON.stringify(await state()));
  // check that one, without pointing (two glows: he should ask)
  await page.click('button[data-say="Junior, check that one"]');
  await wait(400);
  console.log('check (no point)', JSON.stringify(await state()));
  await page.screenshot({ path: path.join(out, '4-ask.png') });
  // point at the nearest patch (p0) and check that one
  const pts = await page.$$('.pt');
  await pts[0].click();
  await wait(200);
  await page.click('button[data-say="Junior, check that one"]');
  await wait(1500);
  console.log('check (pointed)', JSON.stringify(await state()));
  await page.screenshot({ path: path.join(out, '5-trip.png') });
  for (let i = 0; i < 30; i++) { await wait(1000); const s = await state(); if (!s.pilot) { console.log('trip ended after', i + 1, 's', JSON.stringify(s)); break; } }
  const nose = await page.evaluate(() => { const j = window.sim.W.junior, h = j.rotation.y; const p = window.sim.W.patches[0]; return Math.hypot(j.position.x + Math.sin(h) * 0.15 - p.x, j.position.z + Math.cos(h) * 0.15 - p.z).toFixed(2); });
  console.log('nose to patch centre (m):', nose);
  await page.screenshot({ path: path.join(out, '6-arrived.png') });
  // come back
  await page.click('button[data-say="Junior, come back"]');
  await wait(1000);
  console.log('come back', JSON.stringify(await state()));
  for (let i = 0; i < 40; i++) { await wait(1000); const s = await state(); if (!s.pilot) { console.log('home after', i + 1, 's', JSON.stringify(s)); break; } }
  await page.screenshot({ path: path.join(out, '7-home.png') });
  // flare
  await page.keyboard.press('f');
  await wait(250);
  console.log('flare', JSON.stringify(await state()));
  await page.screenshot({ path: path.join(out, '8-flare.png') });
  await wait(2600);
  await page.screenshot({ path: path.join(out, '9-after-flare.png') });
  // help
  await page.click('#helpbtn');
  await wait(300);
  await page.screenshot({ path: path.join(out, '10-help.png') });
  const fps = await page.evaluate(() => new Promise(r => { let n = 0; const t = performance.now(); (function f() { n++; if (performance.now() - t < 1000) requestAnimationFrame(f); else r(n); })(); }));
  console.log('raf/s with help open (page idle):', fps);
  console.log('errors:', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
