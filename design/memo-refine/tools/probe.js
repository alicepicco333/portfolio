// Checks how the visualizations page renders its charts while scrolling (lazy rendering), so the shot script
// waits long enough for every section. Prints the number of drawn marks per chart.
const { chromium } = require('C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'memo-design-study' })).newPage();
  await p.goto('https://thememeontology.netlify.app/visualizations', { waitUntil: 'networkidle', timeout: 90000 });
  await p.waitForTimeout(1500);
  const ids = await p.$$eval('main#app > section', (s) => s.map((x) => x.id));
  const report = async (tag) => console.log(tag, JSON.stringify(await p.$$eval('.graph-wrap', (ws) => ws.map((w) => w.id + ':' + w.querySelectorAll('svg *,canvas,img').length))));
  await report('initial');
  for (const id of ids) {
    await p.evaluate((i) => document.getElementById(i).scrollIntoView(), id);
    await p.waitForTimeout(1500);
  }
  await report('after-scroll');
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(1000);
  await report('back-top');
  console.log(JSON.stringify(await p.$$eval('main#app > section', (s) => s.map((x) => { const c = getComputedStyle(x); return x.id + ' h=' + c.height + ' disp=' + c.display + ' ov=' + c.overflow; }))));
  console.log(JSON.stringify(await p.evaluate(() => { const c = getComputedStyle(document.querySelector('.sec-header')); return { disp: c.display, pad: c.padding, align: c.alignItems, bg: c.backgroundColor }; })));
  console.log(JSON.stringify(await p.evaluate(() => { const c = getComputedStyle(document.querySelector('.graph-wrap')); return { flex: c.flex, h: c.height, bg: c.backgroundColor, pad: c.padding }; })));
  await b.close();
})();
