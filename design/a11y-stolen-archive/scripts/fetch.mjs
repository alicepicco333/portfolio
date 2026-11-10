// Fetch pages of the site as raw text for inspection (no browser).
// Usage: node fetch.mjs <outdir> <page> [page...]
// Project-only User-Agent, no contact details.
import fs from 'node:fs';
import path from 'node:path';
const BASE = 'https://alicepicco333.' + 'github.io/the-stolen-archive/';
const [outdir, ...pages] = process.argv.slice(2);
fs.mkdirSync(outdir, { recursive: true });
for (const p of pages) {
  const r = await fetch(BASE + p, { headers: { 'User-Agent': 'a11y-audit-script' } });
  const t = await r.text();
  const out = p.replace(/[\/?=&#]/g, '_') || 'index.html';
  fs.writeFileSync(path.join(outdir, out), t);
  console.log(r.status, p, t.length);
}
