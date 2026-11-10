// The poster for the project page's start button: a 1600 x 900 still of the simulation with the visor, and the
// render cost of one frame.  node design/junior-sim/poster.cjs <playwright module path> <url> <out.jpg>
const [pwPath, url, out] = process.argv.slice(2);
const { chromium } = require(pwPath);
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(url);
  await page.waitForFunction(() => !document.getElementById('startbtn').disabled, null, { timeout: 120000 });
  await page.click('#startbtn');
  await page.evaluate(() => window.sim.holdResolution());
  await page.mouse.move(800, 300);
  await wait(800);
  await page.keyboard.press('v');  // Junior's view: he reports the glow
  await wait(900);
  await page.keyboard.press('v');  // back to the outside view, his camera in the corner
  await wait(1400);
  const info = await page.evaluate(() => { const r = window.sim.W.renderer.info.render; return { calls: r.calls, triangles: r.triangles, pixelRatio: window.sim.W.renderer.getPixelRatio() }; });
  console.log('last view rendered:', JSON.stringify(info));
  await page.screenshot({ path: out, type: 'jpeg', quality: 86 });
  console.log('saved', out);
  await browser.close();
})();
