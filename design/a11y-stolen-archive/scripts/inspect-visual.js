// Visual checks: reflow at 320 px, 200% zoom (640 px CSS viewport), text spacing (1.4.12),
// clipped text, reduced motion, running animations, token contrast. Screenshots of rendered pages only.
// Usage: node inspect-visual.js <node_modules dir> <out.json> <shots dir>
const path = require('path');
const fs = require('fs');
const NM = process.argv[2] || 'C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules';
const OUT = process.argv[3] || path.join(__dirname, 'visual.json');
const SHOTS = process.argv[4] || path.join(__dirname, '..', 'shots');
const { chromium } = require(path.join(NM, 'playwright'));
const BASE = 'https://alicepicco333.' + 'github.io/the-stolen-archive/';
const PAGES = [
  ['home', 'index.html'],
  ['collection', 'collection.html'],
  ['tours', 'tours.html'],
  ['atlas', 'atlas.html'],
  ['object-001', 'Object-page.html?no=1&tour=Timeline%20Tour&length=short&complexity=fun'],
  ['object-024', 'Object-page.html?no=24&tour=Geo%20Tour&length=long&complexity=expert'],
  ['documentation', 'documentation.html'],
];
const SPACING_CSS = `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`;

// runs in the page: elements that stick out of the viewport sideways, and boxes that cut off their text
const measure = () => {
  const W = document.documentElement.clientWidth;
  const scrollsX = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === 'auto' || o === 'scroll') && p !== document.documentElement && p !== document.body) return true; } return false; };
  const sel = (el) => el.id ? '#' + el.id : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const vis = (el) => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && !el.closest('[hidden],[aria-hidden=true]'); };
  const wide = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (!vis(el) || el.closest('.leaflet-container,svg,.marquee')) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if ((r.right > W + 1 || r.left < -1) && !scrollsX(el)) {
      if (!el.textContent.trim() && !['IMG', 'svg', 'CANVAS', 'BUTTON', 'A', 'INPUT'].includes(el.tagName)) return;
      wide.push({ sel: sel(el), left: Math.round(r.left), right: Math.round(r.right), text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 50) });
    }
  });
  // keep only outermost offenders
  const outer = wide.filter((w, i) => !wide.some((o, j) => j < i && false));
  const clipped = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (!vis(el)) return;
    const s = getComputedStyle(el);
    const hidesY = ['hidden', 'clip'].includes(s.overflowY); const hidesX = ['hidden', 'clip'].includes(s.overflowX);
    if (!hidesY && !hidesX) return;
    if (!el.innerText || el.innerText.trim().length < 2) return;
    if (el.closest('.leaflet-container,.marquee,.visually-hidden,.skip-link') || el.classList.contains('visually-hidden')) return;
    const overY = hidesY && el.scrollHeight > el.clientHeight + 2; const overX = hidesX && el.scrollWidth > el.clientWidth + 2;
    if (overY || overX) clipped.push({ sel: sel(el), overY, overX, client: [el.clientWidth, el.clientHeight], scroll: [el.scrollWidth, el.scrollHeight], text: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 60) });
  });
  return { viewport: W, docScrollWidth: document.documentElement.scrollWidth, bodyOverflowX: getComputedStyle(document.body).overflowX, wide: outer.slice(0, 25), wideCount: wide.length, clipped: clipped.slice(0, 25) };
};

async function load(page, p) {
  await page.goto(BASE + p, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(60); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const out = { reflow320: {}, zoom200: {}, textSpacing: {}, desktop: {}, motion: {} };
  const ua = 'a11y-audit-script (Playwright Chromium)';

  for (const [id, p] of PAGES) {
    // desktop baseline
    let ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: ua });
    let page = await ctx.newPage();
    await load(page, p);
    out.desktop[id] = await page.evaluate(measure);
    // text spacing at desktop width
    await page.addStyleTag({ content: SPACING_CSS });
    await page.waitForTimeout(800);
    out.textSpacing[id] = await page.evaluate(measure);
    if (id === 'home') await page.screenshot({ path: path.join(SHOTS, `v-text-spacing-${id}.png`), fullPage: false });
    await ctx.close();

    // 320 px wide (equivalent to 1280 px at 400% zoom)
    ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, userAgent: ua, deviceScaleFactor: 2 });
    page = await ctx.newPage();
    await load(page, p);
    out.reflow320[id] = await page.evaluate(measure);
    await page.screenshot({ path: path.join(SHOTS, `v-320-${id}.png`), fullPage: false });
    await ctx.close();

    // 640 px wide at scale 2 (1280 px window at 200% zoom)
    ctx = await browser.newContext({ viewport: { width: 640, height: 450 }, userAgent: ua, deviceScaleFactor: 2 });
    page = await ctx.newPage();
    await load(page, p);
    out.zoom200[id] = await page.evaluate(measure);
    await page.screenshot({ path: path.join(SHOTS, `v-200-${id}.png`), fullPage: false });
    await ctx.close();
    console.log(id, '320 wide:', out.reflow320[id].wideCount, 'clipped:', out.reflow320[id].clipped.length, '| 200%:', out.zoom200[id].wideCount, out.zoom200[id].clipped.length, '| spacing clipped:', out.textSpacing[id].clipped.length, '| desktop clipped:', out.desktop[id].clipped.length);
  }

  // Motion: running animations with and without reduced motion
  for (const reduced of [false, true]) {
    for (const [id, p] of [['home', 'index.html'], ['atlas', 'atlas.html'], ['object-001', 'Object-page.html?no=1&tour=Timeline%20Tour&length=short&complexity=fun']]) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: ua, reducedMotion: reduced ? 'reduce' : 'no-preference' });
      const page = await ctx.newPage();
      await load(page, p);
      await page.waitForTimeout(3000);
      out.motion[`${id}-${reduced ? 'reduce' : 'default'}`] = await page.evaluate(() => {
        const running = document.getAnimations().filter((a) => a.playState === 'running');
        const byName = {};
        running.forEach((a) => { const n = a.animationName || a.constructor.name; const it = a.effect?.getTiming?.().iterations; byName[n] = byName[n] || { count: 0, infinite: it === Infinity }; byName[n].count++; });
        const smooth = getComputedStyle(document.documentElement).scrollBehavior;
        return { running: running.length, byName, scrollBehavior: smooth, marqueeToggle: !!document.querySelector('.marquee__toggle') && getComputedStyle(document.querySelector('.marquee__toggle')).display !== 'none' };
      });
      if (!reduced && id === 'object-001') {
        // 3D auto-rotation: compare two frames of the canvas
        const c = await page.$('.viewer3d__canvas canvas');
        if (c) {
          const a = await c.screenshot(); await page.waitForTimeout(1500); const b = await c.screenshot();
          out.motion['object-001-3d-autorotate-default'] = !a.equals(b);
        }
      }
      if (reduced && id === 'object-001') {
        const c = await page.$('.viewer3d__canvas canvas');
        if (c) { const a = await c.screenshot(); await page.waitForTimeout(1500); const b = await c.screenshot(); out.motion['object-001-3d-autorotate-reduce'] = !a.equals(b); }
      }
      await ctx.close();
    }
  }
  console.log(JSON.stringify(out.motion));
  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
})();
