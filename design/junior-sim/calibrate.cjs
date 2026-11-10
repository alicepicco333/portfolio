// Puts Junior at set distances in front of a patch and reads what his glow detection says (area, certainty).
//   node design/junior-sim/calibrate.cjs <playwright module path> <url>
const [pwPath, url] = process.argv.slice(2);
const { chromium } = require(pwPath);
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url);
  await page.waitForFunction(() => !document.getElementById('startbtn').disabled, null, { timeout: 120000 });
  await page.click('#startbtn');
  for (const d of [4, 3.5, 3, 2.5, 2, 1.5, 1.2, 1, 0.8, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25]) {
    const r = await page.evaluate(async d => {
      const { W } = window.sim, j = W.junior, p = W.patches[0];  // p0, approached from home
      const h = 0, nose = 0.135;
      j.rotation.y = h;
      j.position.set(p.x - Math.sin(h) * (d + nose), 0, p.z - Math.cos(h) * (d + nose));
      await new Promise(res => setTimeout(res, 450));
      const b = window.sim.g.glow_blobs.find(x => x.id === p.id);
      return b ? `${d} m: area ${b.area} strength ${b.strength} x ${b.x} dist ${b.dist.toFixed(2)} cells ${b.cells.map(v => v.toFixed(2))}` : `${d} m: not seen`;
    }, d);
    console.log(r);
  }
  await browser.close();
})();
