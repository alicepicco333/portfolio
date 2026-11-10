// Real renders of the group's 3D Junior for the plates. Needs sim-server.js running on :8790.
// node shots.js [name ...]   (no names = all shots). Writes ../img/sim-<name>.png (raw) and, for shots with
// `project`, ../img/sim-<name>.json with world points projected to image pixels (for vector overlays).
const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright');

const OUT = path.join(__dirname, '..', 'img');
// Units are metres, as in sim.html: home ring at (0,0), Junior faces +z, Marvin stands at (-0.45, -1.3).
// Glowing patches at (0.55,1.55), (-1.35,2.15), (1.6,3.3).
const SHOTS = {
  // the deck's poster view: Junior on the home ring, the patches ahead
  poster: { w: 1600, h: 900, junior: [0, 0, 0], chase: true },
  // arrive: Marvin behind Junior on the ring, seen from beside and a little in front
  arrive: { w: 1200, h: 900, junior: [0, 0, 0.35], cam: [-1.25, 0.85, 2.3], look: [-0.25, 0.7, -0.75], fov: 40 },
  // notice: Junior's own camera, as the visor shows it after the squeeze
  notice: { w: 1200, h: 900, junior: [0.05, 0.25, 0.12], eye: true, fov: 62 },
  // steer: Junior out on the plain, turning towards a patch, Marvin small behind
  steer: { w: 1200, h: 900, junior: [0.25, 0.85, 0.45], cam: [1.25, 0.75, 0.05], look: [0.05, 0.12, 1.1], fov: 42 },
  // home: Junior back on the ring, facing Marvin, seen from out on the plain
  home: { w: 1200, h: 900, junior: [0.12, 0.38, -2.83], cam: [1.35, 0.95, 2.0], look: [-0.25, 0.62, -0.75], fov: 40 },
  // from above, for the way-home diagram
  top: { w: 1200, h: 900, junior: [0.8, 1.2, 3.73], cam: [0.15, 3.4, -1.9], look: [0.25, 0, 1.25], fov: 40,
    project: { home: [0, 0, 0], junior: [0.8, 0, 1.2], marvin: [-0.45, 0, -1.3], p1: [0.55, 0, 1.55], p2: [-1.35, 0, 2.15], p3: [1.6, 0, 3.3],
      out: [[0, 0, 0], [-0.18, 0, 0.3], [0.12, 0, 0.55], [-0.08, 0, 0.82], [0.3, 0, 1.02], [0.58, 0, 0.92], [0.8, 0, 1.2]] } },
  // closing: Marvin and Junior, low and wide
  close: { w: 1200, h: 900, junior: [0.12, 0.2, -2.7], cam: [0.95, 0.3, 1.45], look: [-0.35, 0.78, -1.25], fov: 46 },
};

(async () => {
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHOTS);
  const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  for (const name of names) {
    const s = SHOTS[name];
    const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.log('pageerror', e.message));
    await page.goto('http://127.0.0.1:8790/sim#poster');
    // wait for the three models (Junior's wheels baked = his model is in)
    await page.waitForFunction(() => window.sim && window.sim.junior.children.length > 1
      && window.sim.scene.children.filter(o => o.type === 'Group').length >= 6, null, { timeout: 120000 });
    await page.waitForTimeout(2500);
    const proj = await page.evaluate((s) => {
      const { junior, camera, renderer, scene } = window.sim;
      junior.position.set(s.junior[0], 0, s.junior[1]);
      junior.rotation.y = s.junior[2];
      let cam = camera;
      if (s.eye) {
        cam = junior.children.find(o => o.isPerspectiveCamera);
        cam.aspect = s.w / s.h; cam.fov = s.fov; cam.updateProjectionMatrix();
      } else if (!s.chase) {
        cam = camera.clone();
        cam.fov = s.fov; cam.aspect = s.w / s.h; cam.updateProjectionMatrix();
        cam.position.set(...s.cam); cam.lookAt(...s.look);
      }
      const orig = renderer.render.bind(renderer);
      renderer.render = (sc) => orig(sc, cam);
      if (!s.project) return null;
      cam.updateMatrixWorld();
      const out = {};
      for (const [k, p] of Object.entries(s.project)) {
        const pr = q => { const v = camera.position.clone().set(q[0], q[1], q[2]).project(cam); return [Math.round((v.x + 1) / 2 * s.w), Math.round((1 - v.y) / 2 * s.h)]; };
        out[k] = Array.isArray(p[0]) ? p.map(pr) : pr(p);
      }
      return out;
    }, s);
    await page.waitForTimeout(1500);  // Marvin turns towards Junior; let him settle
    await page.locator('#world').screenshot({ path: path.join(OUT, `sim-${name}.png`) });
    if (proj) fs.writeFileSync(path.join(OUT, `sim-${name}.json`), JSON.stringify(proj, null, 1));
    console.log('shot', name, proj ? JSON.stringify(proj) : '');
    await page.close();
  }
  await browser.close();
})();
