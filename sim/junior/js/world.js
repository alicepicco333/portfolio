// The 3D world of sim.html (Bor Ipema): Proxima b's regolith, rocks, three glowing fungus patches, Marvin behind the
// home ring, and Junior with turning wheels. Same positions and sizes as the prototype; the models are compressed copies.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/meshopt_decoder.js';

export const LENGTH = 0.30;  // m, about the size of the Arduino car
export const MARVIN = new THREE.Vector3(-0.45, 0, -1.3);
// file -> bytes, for the progress bar when the server sends no length
const FILES = { 'assets/junior.glb': 900100, 'assets/marvin.glb': 1810516, 'assets/fungus.glb': 156772, 'assets/environment.webp': 37466 };

export function buildWorld(canvas, onProgress) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;  // two views per frame share one shadow pass
  renderer.setScissorTest(true);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x3f2515, 2, 14);  // the backdrop's horizon colour, so the ground fades into it

  // progress over all files
  const loaded = {}, total = {};
  const progress = (file, e) => {
    total[file] = e.lengthComputable && e.total ? e.total : FILES[file];
    loaded[file] = e.loaded;
    const sum = o => Object.keys(FILES).reduce((s, f) => s + (o[f] ?? 0), 0);
    const t = Object.keys(FILES).reduce((s, f) => s + (total[f] ?? FILES[f]), 0);
    onProgress?.(Math.min(sum(loaded), t), t);
  };
  const gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const loadModel = file => new Promise((res, rej) => gltf.load(file, g => { progress(file, { loaded: total[file] ?? FILES[file] }); res(g); }, e => progress(file, e), rej));
  const loadTexture = file => new Promise((res, rej) => new THREE.TextureLoader().load(file, t => { progress(file, { loaded: FILES[file] }); res(t); }, undefined, rej));

  // the backdrop: our Proxima b picture on a far cylinder, horizon at eye height (only the part above its misty horizon)
  const sky = new THREE.Group(); scene.add(sky);
  const skyReady = loadTexture('assets/environment.webp').then(t => {
    Object.assign(t, { colorSpace: THREE.SRGBColorSpace, wrapS: THREE.MirroredRepeatWrapping });
    t.repeat.set(2, 1);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 30, 64, 1, true),
      new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, toneMapped: false }));
    wall.position.y = 14.6; wall.rotation.y = Math.PI * 0.75; sky.add(wall);
  });
  const hemi = new THREE.HemisphereLight(0xffd9b8, 0x201812, 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffa874, 2.2);  // Proxima: a low, red sun
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.1, far: 12 });
  scene.add(sun, sun.target);

  // dusty regolith
  const speckle = document.createElement('canvas');
  speckle.width = speckle.height = 1024;
  const sg = speckle.getContext('2d');
  sg.fillStyle = '#5b4a3e'; sg.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 11000; i++) {
    const v = 60 + Math.random() * 60 | 0;
    sg.fillStyle = `rgb(${v + 20},${v},${v - 14})`; sg.beginPath(); sg.arc(Math.random() * 1024, Math.random() * 1024, 3, 0, 7); sg.fill();
  }
  const groundTex = Object.assign(new THREE.CanvasTexture(speckle), { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping,
    colorSpace: THREE.SRGBColorSpace, anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()) });
  groundTex.repeat.set(90, 90);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ roughness: 1, map: groundTex }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const home = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.23, 48), new THREE.MeshBasicMaterial({ color: 0xdca355, transparent: true, opacity: 0.7 }));
  home.rotation.x = -Math.PI / 2; home.position.y = 0.002;
  scene.add(home);

  // rocks: the obstacles Junior's distance sensor stops for
  const rocks = [[0.75, 0.55, 0.09], [-0.95, 0.7, 0.12], [0.15, 2.6, 0.16], [-1.6, 2.4, 0.2], [1.9, 2.0, 0.14], [-0.9, -0.8, 0.1]].map(([x, z, r]) => {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), new THREE.MeshStandardMaterial({ color: 0x6a5848, roughness: 0.95, flatShading: true }));
    m.position.set(x, r * 0.55, z); m.rotation.set(x * 3, z * 2, 0); m.castShadow = m.receiveShadow = true;
    scene.add(m);
    return { x, z, r, y: r * 0.55 };
  });

  // fungus over buried hazards: it glows green-cyan, the colour glow.py looked for
  const halo = document.createElement('canvas');
  halo.width = halo.height = 128;
  const hg = halo.getContext('2d'), grad = hg.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(110,255,170,1)'); grad.addColorStop(0.45, 'rgba(60,255,150,.85)'); grad.addColorStop(1, 'rgba(40,255,140,0)');
  hg.fillStyle = grad; hg.fillRect(0, 0, 128, 128);
  const haloTex = Object.assign(new THREE.CanvasTexture(halo), { colorSpace: THREE.SRGBColorSpace });
  const patches = [[0.55, 1.55], [-1.35, 2.15], [1.6, 3.3]].map(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, fog: false, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
    glow.scale.set(0.42, 0.3, 1); glow.position.y = 0.12; g.add(glow);
    const light = new THREE.PointLight(0x46ff9a, 1.2, 1.4); light.position.y = 0.1; g.add(light);
    return { id: 'p' + i, x, z, g, glow, light, centre: new THREE.Vector3(x, 0.12, z) };
  });
  const fungusReady = loadModel('assets/fungus.glb').then(({ scene: f0 }) => {
    const box = new THREE.Box3().setFromObject(f0), s = 0.16 / box.getSize(new THREE.Vector3()).y;
    for (const p of patches) {
      const f = f0.clone(); f.scale.setScalar(s); f.position.y = -box.min.y * s; p.g.add(f);
    }
  });

  // Marvin, the salvage worker, behind Junior's home, watching him
  const blockers = [...rocks, { x: MARVIN.x, z: MARVIN.z, r: 0.25, y: 0.5, tall: true }];  // Junior can't drive through Marvin's boots either
  const marvin = new THREE.Group(); marvin.position.copy(MARVIN); scene.add(marvin);
  const marvinReady = loadModel('assets/marvin.glb').then(({ scene: m }) => {
    const box = new THREE.Box3().setFromObject(m), s = 1.8 / box.getSize(new THREE.Vector3()).y, c = box.getCenter(new THREE.Vector3());
    m.scale.setScalar(s); m.position.set(-c.x * s, -box.min.y * s, -c.z * s);
    m.traverse(o => { if (o.isMesh) { o.castShadow = true; if (o.isSkinnedMesh) o.frustumCulled = false; } });
    marvin.add(m);
  });

  // Junior: position x/z in m, rotation.y = heading; he faces +z, +x is his left
  const junior = new THREE.Group(); scene.add(junior);
  const wheelPivots = [];  // [pivot, side (-1 left, 1 right), radius]
  const eye = new THREE.PerspectiveCamera(62, 16 / 9, 0.03, 30);  // Junior's camera on his nose, as rendered
  const eyeDetect = new THREE.PerspectiveCamera(62, 16 / 9, 0.03, 30);  // the same camera at its own 16:9, for the glow detection
  for (const c of [eye, eyeDetect]) {
    c.position.set(0, 0.16, LENGTH * 0.45); c.rotation.order = 'YXZ'; c.rotation.set(-0.1, Math.PI, 0);
    junior.add(c);
  }
  const juniorReady = loadModel('assets/junior.glb').then(({ scene: model }) => {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const s = LENGTH / Math.max(size.x, size.z);
    model.scale.setScalar(s); model.position.set(-c.x * s, -box.min.y * s, -c.z * s);
    junior.add(model);
    // As in sim.html: bake the four wheels out of the skinned mesh, so each can turn around its own centre.
    for (const name of ['tripo_part_1', 'tripo_part_2', 'tripo_part_12', 'tripo_part_13']) {
      const o = model.getObjectByName(name);
      if (!o?.isSkinnedMesh) continue;
      const src = o.geometry, pos = src.attributes.position, arr = new Float32Array(pos.count * 3), v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) { o.applyBoneTransform(i, v.fromBufferAttribute(pos, i)); arr.set([v.x, v.y, v.z], i * 3); }
      const geo = new THREE.BufferGeometry();  // float positions: the compressed file stores them as 16-bit integers
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      for (const k of ['normal', 'uv']) if (src.attributes[k]) geo.setAttribute(k, src.attributes[k]);
      geo.setIndex(src.index);
      if (!o.matrix.equals(new THREE.Matrix4())) geo.applyMatrix4(o.matrix);
      geo.computeBoundingBox();
      const mid = geo.boundingBox.getCenter(new THREE.Vector3()), pivot = new THREE.Group(), piece = new THREE.Mesh(geo, o.material);
      pivot.position.copy(mid); piece.position.copy(mid).multiplyScalar(-1); pivot.add(piece); o.parent.add(pivot); o.visible = false;
      piece.castShadow = true;
      wheelPivots.push([pivot, mid.x > c.x ? -1 : 1, geo.boundingBox.getSize(v).y * s / 2]);
    }
    model.traverse(o => { if (o.isMesh) { o.castShadow = true; if (o.isSkinnedMesh) o.frustumCulled = false; } });
  });

  // marks the browser adds: the patch you point at, and traces left for the next crew
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xe8e9ee, transparent: true, opacity: 0.9, depthWrite: false });
  const pointRing = new THREE.Mesh(new THREE.RingGeometry(0.27, 0.29, 64), ringMat);
  pointRing.rotation.x = -Math.PI / 2; pointRing.position.y = 0.004; pointRing.visible = false; scene.add(pointRing);
  const addTrace = (x, z) => {
    const t = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0xe8e9ee, roughness: 0.6 }));
    post.position.y = 0.14; post.castShadow = true;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.06, 32), ringMat);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.004;
    t.add(post, ring); t.position.set(x, 0, z); scene.add(t);
  };

  const ready = Promise.all([skyReady, fungusReady, marvinReady, juniorReady]);
  return { renderer, scene, sky, sun, hemi, junior, wheelPivots, eye, eyeDetect, marvin, patches, rocks, blockers, pointRing, addTrace, ready };
}

// ---------------------------------------------------------------- glow detection, from geometry
// glow.py measured the fungus colour in an 8 x 6 grid of Junior's picture. Here the scene knows where each patch is,
// so we project it into Junior's camera and fill in the same answer: which cells it covers, where it is, how sure.
const COLS = 8, ROWS = 6, GLOW_FRACTION = 0.12, PATCH = 0.17;
const _v = new THREE.Vector3(), _c = new THREE.Vector3(), _eyePos = new THREE.Vector3();
const zone = col => (col < 3 ? 'ahead left' : col >= 5 ? 'ahead right' : 'ahead');
export const NO_GLOW = Object.freeze({ glow: 0, glow_at: null, glow_box: null, glow_id: null, glow_blobs: [], glows: {}, flare: false });

function occluded(from, to, blockers) {  // a rock (or Marvin's legs) between Junior's eye and the patch
  const dx = to.x - from.x, dz = to.z - from.z, dy = to.y - from.y, len2 = dx * dx + dy * dy + dz * dz;
  for (const b of blockers) {
    const t = Math.max(0, Math.min(1, ((b.x - from.x) * dx + (b.y - from.y) * dy + (b.z - from.z) * dz) / len2));
    const px = from.x + dx * t - b.x, pz = from.z + dz * t - b.z, py = b.tall ? 0 : from.y + dy * t - b.y;
    if (t > 0.02 && t < 0.98 && Math.hypot(px, py, pz) < b.r * 0.9) return true;
  }
  return false;
}

export function detectGlows(cam, patches, blockers, nose, flare) {
  if (flare) return { ...NO_GLOW, flare: true };
  cam.updateMatrixWorld();
  cam.getWorldPosition(_eyePos);
  const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), tanH = tanV * cam.aspect;
  const blobs = [];
  for (const p of patches) {
    _c.copy(p.centre).applyMatrix4(cam.matrixWorldInverse);
    const depth = -_c.z;
    if (depth < 0.08) continue;  // behind or inside his camera
    // the glowing patch: a box as wide as its halo and 27 cm tall
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const dx of [-PATCH, PATCH]) for (const dz of [-PATCH, PATCH]) for (const y of [0, 0.27]) {
      _v.set(p.x + dx, y, p.z + dz).applyMatrix4(cam.matrixWorldInverse);
      if (-_v.z < 0.03) _v.z = -0.03;  // a corner behind the lens: push it in front, at the edge of the picture
      _v.applyMatrix4(cam.projectionMatrix);
      const px = (_v.x + 1) / 2, py = (1 - _v.y) / 2;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
    const cx0 = Math.max(0, x0), cx1 = Math.min(1, x1), cy0 = Math.max(0, y0), cy1 = Math.min(1, y1);
    if (cx1 <= cx0 || cy1 <= cy0) continue;
    // the halo sprite (42 x 30 cm): how much of its strongest cell it fills = how sure (glow.py: 0.3 + share)
    const sw = 0.42 / depth / (2 * tanH), sh = 0.3 / depth / (2 * tanV);
    const sx = 0.5 + (_c.x / depth) / tanH / 2, sy = 0.5 - (_c.y / depth) / tanV / 2;
    const seen = Math.max(0, Math.min(1, sx + sw / 2) - Math.max(0, sx - sw / 2)) / sw * Math.max(0, Math.min(1, sy + sh / 2) - Math.max(0, sy - sh / 2)) / sh;
    const share = Math.min(1, sw * COLS * sh * ROWS * 0.35) * seen;  // ~0.2 at 2.5 m, as glow.py measured on the rendered picture
    if (share < GLOW_FRACTION) continue;  // too far or too far out of the picture to count
    if (occluded(_eyePos, p.centre, blockers)) continue;
    // cells it lights (a cell counts when 12% of it glows), its centre and its strongest cell
    let n = 0, cc0 = COLS, cc1 = -1, rr0 = ROWS, rr1 = -1;
    for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
      const ox = Math.max(0, Math.min(cx1, (col + 1) / COLS) - Math.max(cx0, col / COLS)) * COLS;
      const oy = Math.max(0, Math.min(cy1, (r + 1) / ROWS) - Math.max(cy0, r / ROWS)) * ROWS;
      if (ox * oy > GLOW_FRACTION) { n++; cc0 = Math.min(cc0, col); cc1 = Math.max(cc1, col); rr0 = Math.min(rr0, r); rr1 = Math.max(rr1, r); }
    }
    if (!n) continue;
    const col = Math.max(0, Math.min(COLS - 1, Math.floor(Math.max(0, Math.min(0.999, sx)) * COLS)));
    const row = Math.max(0, Math.min(ROWS - 1, Math.floor(Math.max(0, Math.min(0.999, sy)) * ROWS)));
    blobs.push({
      id: p.id, x: Math.round((cx0 + cx1) / 2 * 1000) / 1000, area: Math.round((cx1 - cx0) * (cy1 - cy0) * 100) / 100,  // share of the picture: ~0.55 at 30 cm
      box: [col / COLS, row / ROWS, 1 / COLS, 1 / ROWS], cells: [cc0 / COLS, rr0 / ROWS, (cc1 - cc0 + 1) / COLS, (rr1 - rr0 + 1) / ROWS],
      at: zone(col), strength: Math.round(Math.min(1, 0.3 + share) * 100) / 100,
      dist: Math.hypot(p.x - nose.x, p.z - nose.z),  // m from Junior's nose to the patch centre (the ticks)
    });
  }
  if (!blobs.length) return { ...NO_GLOW };
  blobs.sort((a, b) => a.x - b.x);
  const best = blobs.reduce((a, b) => (b.strength > a.strength || (b.strength === a.strength && b.dist < a.dist) ? b : a));
  const glows = {};
  for (const b of blobs) glows[b.at] = Math.max(glows[b.at] ?? 0, b.strength);
  return { glow: best.strength, glow_at: best.at, glow_box: best.box, glow_id: best.id, glow_blobs: blobs, glows, flare: false };
}
