// Second pass: rock stop, dodge on the way to a glow, stop mid-trip, ask + answer, mark hazard, talk gate,
// the camera hand (fake camera), and the pause when the iframe is scrolled out of view.
//   node design/junior-sim/test-extra.cjs <playwright module path> <url> <out dir>
const [pwPath, url, out] = process.argv.slice(2);
const { chromium } = require(pwPath);
const path = require('path');
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, permissions: ['camera', 'microphone'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(url);
  await page.waitForFunction(() => !document.getElementById('startbtn').disabled, null, { timeout: 120000 });
  await page.click('#startbtn');
  await wait(800);
  const st = () => page.evaluate(() => { const s = window.sim, j = s.W.junior; return { x: +j.position.x.toFixed(2), z: +j.position.z.toFixed(2), h: Math.round(j.rotation.y * 57.3), pilot: s.pilot.name, why: s.pilot.why, blocked: s.S.blocked, drive: s.S.drive, said: document.getElementById('said').textContent, verdict: document.getElementById('verdict').textContent, heard: document.getElementById('heard').textContent }; });
  const place = (x, z, h) => page.evaluate(([x, z, h]) => { const j = window.sim.W.junior; j.position.set(x, 0, z); j.rotation.y = h; }, [x, z, h]);

  // 1. rock stop: aim at the rock at (0.75, 0.55) and hold an open hand
  await place(0.1, 0.1, Math.atan2(0.65, 0.45));
  await page.keyboard.down('ArrowUp'); await wait(4000);
  const rs = await st(); await page.keyboard.up('ArrowUp');
  const gap = await page.evaluate(() => { const j = window.sim.W.junior, h = j.rotation.y; return ((Math.hypot(0.75 - (j.position.x + Math.sin(h) * 0.15), 0.55 - (j.position.z + Math.cos(h) * 0.15)) - 0.09) * 100).toFixed(0); });
  console.log('1 rock stop', JSON.stringify(rs), 'nose to rock surface cm:', gap);
  await page.screenshot({ path: path.join(out, 'x1-rock.png') });

  // 2. a rock between Junior and the glow he was sent to: he goes round it
  await place(-0.6, 1.95, Math.atan2(2.2, 1.35));  // the rock at (0.15, 2.6) is in his path, but not between his eye and the glow
  await page.evaluate(() => { window.sim.S.pointed = { id: 'p2', t: performance.now() }; });
  await wait(300);
  await page.click('button[data-say="Junior, check that one"]');
  const log = [];
  for (let i = 0; i < 25; i++) { await wait(1000); const s = await st(); log.push(`${s.x},${s.z}${s.blocked ? ' B' : ''}`); if (!s.pilot) break; }
  const s2 = await st();
  console.log('2 dodge', log.join(' | '), '->', s2.why, '|', s2.said, '|', s2.verdict);
  await page.screenshot({ path: path.join(out, 'x2-dodge.png') });

  // 3. stop mid-trip
  await page.click('button[data-say="Junior, come back"]'); await wait(1200);
  await page.click('button[data-say="Stop"]'); await wait(300);
  console.log('3 stop', JSON.stringify(await st()));

  // 4. ask, then answer "left"
  await page.evaluate(() => { window.sim.S.pointed = null; }); await place(0, 0.3, 0); await wait(300);
  await page.click('button[data-say="Junior, check that one"]'); await wait(1000);
  const asked = (await st()).said;
  await page.click('button[data-say="Left"]'); await wait(1300);
  const ans = await st();
  console.log('4 ask/answer', asked, '->', ans.pilot, '|', ans.verdict, '|', ans.said);
  await page.click('button[data-say="Stop"]'); await wait(200);

  // 5. "left" with no question: a turn and a short drive; then mark a hazard
  await page.click('button[data-say="Left"]'); await wait(2600);
  console.log('5 left', JSON.stringify(await st()));
  await page.click('button[data-say="Junior, mark this hazard"]'); await wait(300);
  console.log('5 mark', (await st()).said, '| traces', await page.textContent('#traces'));

  // 6. talk gate: hold Space, let go
  await page.keyboard.down('Space'); await wait(700); const listening = await page.isVisible('#listenpill'); await page.keyboard.up('Space'); await wait(1500);
  console.log('6 gate', 'listening pill shown:', listening, '| heard:', (await st()).heard);

  // 7. your hand on camera (fake camera: a test pattern, no hand)
  await page.click('#handbtn');
  await page.waitForFunction(() => document.getElementById('handbtn').getAttribute('aria-pressed') === 'true' || document.getElementById('handcam').hidden, null, { timeout: 90000 }).catch(() => {});
  await wait(1500);
  console.log('7 hand', 'pressed:', await page.getAttribute('#handbtn', 'aria-pressed'), '| label:', await page.textContent('#handlabel'), '| heard:', (await st()).heard);
  await page.screenshot({ path: path.join(out, 'x7-hand.png') });
  await page.click('#handbtn'); await wait(200);

  // 8. embedded in an iframe: running, then scrolled out of view = paused
  const p2 = await ctx.newPage();
  p2.on('pageerror', e => errors.push('iframe pageerror: ' + e.message));
  await p2.setContent(`<body style="margin:0;font:16px sans-serif"><p style="height:200px">Project page</p>
    <iframe id="f" src="${url}index.html" allow="camera; microphone" style="width:1100px;height:690px;border:0"></iframe><div style="height:3000px"></div></body>`);
  const fr = await (await p2.$('#f')).contentFrame();
  await fr.waitForFunction(() => !document.getElementById('startbtn').disabled, null, { timeout: 120000 });
  await fr.click('#startbtn'); await wait(800);
  const t1 = await fr.evaluate(() => window.sim.S.now); await wait(1000); const t2 = await fr.evaluate(() => window.sim.S.now);
  await p2.evaluate(() => window.scrollTo(0, 2500)); await wait(600);
  const t3 = await fr.evaluate(() => window.sim.S.now); await wait(1000); const t4 = await fr.evaluate(() => window.sim.S.now);
  await p2.evaluate(() => window.scrollTo(0, 0)); await wait(600);
  const t5 = await fr.evaluate(() => window.sim.S.now); await wait(800); const t6 = await fr.evaluate(() => window.sim.S.now);
  console.log('8 iframe', 'in view +', (t2 - t1).toFixed(2), 's | scrolled away +', (t4 - t3).toFixed(2), 's | back +', (t6 - t5).toFixed(2), 's');
  await p2.screenshot({ path: path.join(out, 'x8-iframe.png') });

  console.log('errors:', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
