// Asks Chromium (through the DevTools protocol) how it exposes the focusable items inside the
// role="img" maps and graph: role, name, and whether they are ignored. A screen reader test is still needed.
// Usage: node probe-axtree.js <node_modules dir>
const path = require('path');
const NM = process.argv[2] || 'C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules';
const { chromium } = require(path.join(NM, 'playwright'));
const BASE = 'https://alicepicco333.' + 'github.io/the-stolen-archive/';

async function probe(page, label, selector) {
  const client = await page.context().newCDPSession(page);
  await client.send('DOM.getDocument', { depth: -1 });
  const { root } = await client.send('DOM.getDocument', { depth: 0 });
  const { nodeIds } = await client.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector });
  const rows = [];
  for (const nodeId of nodeIds.slice(0, 4)) {
    const { nodes } = await client.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
    const n = nodes[0];
    rows.push({ role: n.role?.value, name: n.name?.value, ignored: n.ignored, why: (n.ignoredReasons || []).map((r) => r.name).join(',') });
  }
  console.log(label, `(${nodeIds.length} found)`, JSON.stringify(rows));
}

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: 'a11y-audit-script (Playwright Chromium)' })).newPage();
  await page.goto(BASE + 'atlas.html', { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  await probe(page, 'atlas: Leaflet markers', '#atlas-map .leaflet-marker-icon');
  await probe(page, 'atlas: Leaflet zoom buttons', '#atlas-map .leaflet-control-zoom a');
  await probe(page, 'atlas: floor plan links', '#floor-markers a:not([hidden])');
  await page.goto(BASE + 'Object-page.html?no=1&tour=Timeline%20Tour&length=short&complexity=fun', { waitUntil: 'load' });
  await page.waitForTimeout(4500);
  await probe(page, 'object: floor plan links', '#floor-markers a');
  await probe(page, 'object: graph buttons', '.g2-node[role=button]');
  await browser.close();
})();
