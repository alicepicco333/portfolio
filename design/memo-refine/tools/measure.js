// Prints the left edges and paddings of elements that should line up, with memo-refine.css injected.
//   node tools/measure.js <page, e.g. visualizations or "visualizations#ontology"> <selector> [<selector> ...]
const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright');
(async () => {
  const [, , urlPath, ...sels] = process.argv;
  const width = +(process.env.W || 1440);
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width, height: 900 }, userAgent: 'memo-design-study' })).newPage();
  await p.goto('https://thememeontology.netlify.app/' + urlPath.replace(/^\//, ''), { waitUntil: 'networkidle', timeout: 90000 });
  await p.addStyleTag({ content: fs.readFileSync(path.join(__dirname, '..', 'memo-refine.css'), 'utf8') });
  await p.evaluate(async () => {
    for (let y = 0; y < Math.min(document.documentElement.scrollHeight, 12000); y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 300)); }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(800);
  for (const s of sels) {
    const r = await p.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return 'not found';
      const c = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return `x=${Math.round(box.left)} w=${Math.round(box.width)} h=${Math.round(box.height)} pad=${c.padding} margin=${c.margin} disp=${c.display} grid=${c.gridTemplateColumns}`;
    }, s);
    console.log(s.padEnd(48), r);
  }
  await b.close();
})();
