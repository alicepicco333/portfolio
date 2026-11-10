// Screenshots of the live MEMO site, for study only (not part of the proposals).
const { chromium } = require('C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const pages = [['home', '/'], ['viz', '/visualizations'], ['thesis', '/thesis'], ['sparql', '/sparql'], ['family', '/visualizations#sec-family'], ['gallery', '/visualizations#sec-variant-gallery']];
  for (const [vw, vh, tag] of [[1440, 900, 'd'], [390, 844, 'm']]) {
    const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, userAgent: 'memo-design-study' });
    const p = await ctx.newPage();
    for (const [n, u] of pages) {
      try {
        await p.goto('https://thememeontology.netlify.app' + u, { waitUntil: 'networkidle', timeout: 60000 });
        await p.waitForTimeout(2500);
        await p.screenshot({ path: `${out}/${n}-${tag}.png` });
        console.log('ok', n, tag);
      } catch (e) { console.log('fail', n, tag, e.message.slice(0, 100)); }
    }
    await ctx.close();
  }
  await b.close();
})();
