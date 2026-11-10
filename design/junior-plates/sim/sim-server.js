// Serves the group's 3D Junior (Code/Visor/sim.html) on its own, without the visor, so the plates can use
// real renders of it. /sim -> sim.html, /assets and /vendor -> the final deck's folders; the visor's
// endpoints (/events, /update, /frame) answer empty, so Junior stands still until shots.js moves him.
// Run: node sim-server.js [port]   (default 8790), then open http://127.0.0.1:8790/sim#poster
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/awlic/Projects/mmixd-group8-junior/FINAL - demo Thu 22 Oct';
const SIM = path.join(ROOT, 'Code/Visor/sim.html');
const DECK = path.join(ROOT, 'Presentation/deck');
const PORT = Number(process.argv[2] || 8790);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.webp': 'image/webp' };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/events') { res.writeHead(204); return res.end(); }
  if (url === '/update' || url.startsWith('/frame')) { res.writeHead(204); return res.end(); }
  let file = null;
  if (url === '/sim' || url === '/') file = SIM;
  else if (url.startsWith('/assets/') || url.startsWith('/vendor/')) file = path.join(DECK, url);
  if (!file || !path.resolve(file).startsWith(path.resolve(ROOT)) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`sim on http://127.0.0.1:${PORT}/sim#poster`));
