// Renders the plates in plates.html to public/images/projects/18-p01.jpg ... 18-p17.jpg.
// Each plate is shot at deviceScaleFactor 2 (3200 x 1800) and downsampled to 1600 x 900 by downsample.py,
// so the type stays crisp. Usage: node render.js [p01 p05 ...]   (no ids = all plates)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright');

const HERE = __dirname;
const TMP = path.join(HERE, '_render');
const OUT = path.join(HERE, '..', '..', 'public', 'images', 'projects');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const file = path.join(HERE, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(HERE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  fs.mkdirSync(TMP, { recursive: true });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: 2 });
  page.on('console', m => m.type() === 'error' && console.log('console:', m.text()));
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.goto(`http://127.0.0.1:${port}/plates.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : await page.$$eval('section.plate', s => s.map(e => e.id));
  // a check: text that runs out of its plate or its column
  const over = await page.evaluate(() => [...document.querySelectorAll('section.plate')].flatMap(p => {
    const pr = p.getBoundingClientRect();
    return [...p.querySelectorAll('p,li,h1,h2,h3,td,div.lab,span')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width && (r.bottom > pr.bottom - 40 || r.right > pr.right - 40) && !e.closest('.folio');
    }).map(e => `${p.id}: ${e.tagName} "${e.textContent.trim().slice(0, 50)}" bottom ${Math.round(e.getBoundingClientRect().bottom - pr.top)}`);
  }));
  if (over.length) console.log('near or past the edge:\n ' + over.join('\n '));
  for (const id of ids) {
    await page.locator('#' + id).screenshot({ path: path.join(TMP, id + '.png') });
  }
  await browser.close();
  server.close();
  execFileSync('python', [path.join(HERE, 'downsample.py'), TMP, OUT, ...ids], { stdio: 'inherit' });
})();
