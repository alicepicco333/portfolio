// Keyboard checks with a simulated keyboard (Playwright key presses in Chromium):
// Tab order, focus indicator styles, focus inside popups and the lightbox, tabs with arrow keys.
// A simulated keyboard is not a real keyboard pass: Alice repeats these by hand.
// Usage: node inspect-keyboard.js <node_modules dir> <out.json> <shots dir>
const path = require('path');
const fs = require('fs');
const NM = process.argv[2] || 'C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules';
const OUT = process.argv[3] || path.join(__dirname, 'keyboard.json');
const SHOTS = process.argv[4] || path.join(__dirname, '..', 'shots');
const { chromium } = require(path.join(NM, 'playwright'));
const BASE = 'https://alicepicco333.' + 'github.io/the-stolen-archive/';
const OBJ1 = 'Object-page.html?no=1&tour=Timeline%20Tour&length=short&complexity=fun';
const OBJ8 = 'Object-page.html?no=8&tour=Colonial%20Conquests%20Tour&length=medium&complexity=basic';

const describe = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return { tag: 'body' };
  const r = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70);
  const header = document.querySelector('.site-header');
  const hr = header ? header.getBoundingClientRect() : null;
  const headerShown = header && !header.classList.contains('is-hidden') && hr.bottom > 0;
  const inViewport = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  const underHeader = headerShown && !header.contains(el) && r.top < hr.bottom && r.bottom <= hr.bottom + 2;
  const covered = (() => { // is the centre of the element covered by something else (an overlay)?
    const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1); const y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
    const top = document.elementFromPoint(x, y);
    return top && !el.contains(top) && !top.contains(el) ? (top.id || top.className?.baseVal || top.className || top.tagName).toString().slice(0, 40) : null;
  })();
  return {
    tag: el.tagName.toLowerCase(), id: el.id || null, role: el.getAttribute('role'), name,
    cls: (typeof el.className === 'string' ? el.className : el.className?.baseVal || '').slice(0, 50),
    rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
    inViewport, underHeader, covered,
    outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`, boxShadow: s.boxShadow === 'none' ? null : s.boxShadow.slice(0, 60),
    isSVG: el instanceof SVGElement, focusVisible: el.matches(':focus-visible'),
    inDialog: !!el.closest('[role=dialog]'),
  };
};

async function tabWalk(page, max) {
  const seq = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(60);
    const d = await page.evaluate(describe);
    seq.push(d);
    if (d.tag === 'body' && i > 3) break;
  }
  return seq;
}

async function shotFocus(page, file, pad = 40) {
  const box = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const vp = page.viewportSize();
  const x = Math.max(0, box.x - pad); const y = Math.max(0, box.y - pad);
  const w = Math.min(vp.width - x, box.w + pad * 2); const h = Math.min(vp.height - y, box.h + pad * 2);
  if (w > 10 && h > 10) await page.screenshot({ path: path.join(SHOTS, file), clip: { x, y, width: w, height: h } });
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const out = {};
  const ctxOpts = { viewport: { width: 1280, height: 900 }, userAgent: 'a11y-audit-script (Playwright Chromium)' };

  // 1. Tab walks
  for (const [id, p, max] of [['home', 'index.html', 130], ['collection', 'collection.html', 70], ['atlas', 'atlas.html', 150], ['object-001', OBJ1, 160], ['tours', 'tours.html', 130]]) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.waitForTimeout(3500);
    out['tab-' + id] = await tabWalk(page, max);
    console.log(id, 'tab stops until body/limit:', out['tab-' + id].length);
    await ctx.close();
  }

  // 2. Skip link
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await page.goto(BASE + 'index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.keyboard.press('Tab');
    const first = await page.evaluate(describe);
    await shotFocus(page, 'k-skip-link.png', 30);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.press('Tab');
    const after = await page.evaluate(describe);
    out.skip = { first, afterEnterThenTab: after };
    await ctx.close();
  }

  // 3. Era tabs (home): arrow keys
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await page.goto(BASE + 'index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.focus('#era-tab-0');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    out.eraTabs = await page.evaluate(() => ({ focused: document.activeElement.id, selected: [...document.querySelectorAll('[role=tab]')].map((t) => t.getAttribute('aria-selected')), panelTitle: document.getElementById('era-title')?.textContent }));
    await page.keyboard.press('Tab');
    out.eraTabs.afterTab = await page.evaluate(describe);
    await ctx.close();
  }

  // 4. Atlas: floor tabs, map markers and their pop-ups, Escape
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await page.goto(BASE + 'atlas.html', { waitUntil: 'load' });
    await page.waitForTimeout(3500);
    await page.focus('.floor-switch [role=tab][data-floor="1"]');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    out.floorTabs = await page.evaluate(() => ({ focused: document.activeElement.textContent.trim(), selected: [...document.querySelectorAll('.floor-switch [role=tab]')].map((t) => t.getAttribute('aria-selected')), planFloor: document.getElementById('floor-plan').dataset.floor }));
    // first Leaflet marker
    await page.evaluate(() => document.querySelector('#atlas-map').scrollIntoView({ block: 'center' }));
    await page.focus('#atlas-map .atlas-origin');
    await page.waitForTimeout(400);
    out.mapMarker = await page.evaluate(() => { const d = document.activeElement; const pop = document.querySelector('.atlas-pop:not([hidden])'); return { focused: d.className, title: d.getAttribute('title'), tabindex: d.getAttribute('tabindex'), role: d.getAttribute('role'), describedby: d.getAttribute('aria-describedby'), pop: pop ? { role: pop.getAttribute('role'), text: pop.textContent.slice(0, 120) } : null }; });
    await shotFocus(page, 'k-atlas-marker-focus.png', 120);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    out.mapMarker.afterEscape = await page.evaluate(() => ({ popOpen: !!document.querySelector('.atlas-pop:not([hidden])'), focused: document.activeElement.className }));
    // hover the marker, then move the pointer up onto the pop-up: does it stay? (1.4.13 hoverable)
    await page.keyboard.press('Tab');
    const mk = await page.$('#atlas-map .atlas-origin');
    const b = await mk.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(300);
    const pb = await page.evaluate(() => { const p = document.querySelector('.atlas-pop:not([hidden])'); if (!p) return null; const r = p.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    let hoverable = null;
    if (pb) {
      await page.mouse.move(pb.x + pb.w / 2, pb.y + pb.h / 2, { steps: 8 });
      await page.waitForTimeout(300);
      hoverable = await page.evaluate(() => !!document.querySelector('.atlas-pop:not([hidden])'));
    }
    out.mapMarker.hover = { popShownOnHover: !!pb, stillShownWhenPointerOnPop: hoverable };
    // floor plan marker focus
    await page.evaluate(() => document.querySelector('#floor-plan').scrollIntoView({ block: 'center' }));
    await page.focus('.floor-switch [role=tab][data-floor="1"]');
    await page.keyboard.press('Enter');
    await page.focus('#floor-markers a:not([hidden])');
    await page.waitForTimeout(300);
    out.floorMarker = await page.evaluate(describe);
    await shotFocus(page, 'k-floorplan-marker-focus.png', 80);
    // Leaflet map container itself
    await page.focus('#atlas-map');
    out.mapContainer = await page.evaluate(describe);
    await page.evaluate(() => document.querySelector('#atlas-map').scrollIntoView({ block: 'center' }));
    await shotFocus(page, 'k-atlas-map-container-focus.png', 20);
    await ctx.close();
  }

  // 5. Object page: lightbox, graph note, next object, strip button
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await page.goto(BASE + OBJ8, { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    await page.focus('#gallery-enlarge');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const inBox = [await page.evaluate(describe)];
    for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(60); inBox.push(await page.evaluate(describe)); }
    await page.screenshot({ path: path.join(SHOTS, 'k-lightbox-tab-escapes.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    out.lightbox = { sequence: inBox, afterEscape: await page.evaluate(describe), alt: await page.evaluate(() => document.getElementById('expandedImg').alt) };

    // graph: first node that opens a note
    await page.evaluate(() => document.querySelector('#graph2d').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(500);
    const nodes = await page.$$('.g2-node[role=button]');
    out.graph = { buttons: nodes.length };
    if (nodes.length) {
      await nodes[0].focus();
      await page.waitForTimeout(200);
      out.graph.firstFocus = await page.evaluate(describe);
      await shotFocus(page, 'k-graph-node-focus.png', 60);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
      out.graph.afterEnter = await page.evaluate(describe);
      out.graph.expanded = await page.evaluate(() => document.querySelectorAll('.g2-node[role=button]').length);
      const dialogBtn = await page.$('.g2-node[aria-haspopup=dialog]');
      if (dialogBtn) {
        await dialogBtn.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(400);
        out.graph.noteOpen = await page.evaluate(describe);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        out.graph.noteAfterEscape = await page.evaluate(describe);
      }
    }

    // Next object: where does focus go, what changes
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.focus('#next');
    const before = await page.evaluate(() => ({ h1: document.getElementById('item-title').textContent, title: document.title, url: location.href }));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => ({ h1: document.getElementById('item-title').textContent, title: document.title, url: location.href, focused: document.activeElement.id || document.activeElement.tagName }));
    out.nextObject = { before, after };

    // strip button at the bottom: does focus follow the page back to the top?
    const stripBtn = await page.$('#object-strip li:nth-child(5) button');
    await stripBtn.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    out.stripButton = { focusAfter: await page.evaluate(describe), scrollY: await page.evaluate(() => scrollY), h1: await page.evaluate(() => document.getElementById('item-title').textContent) };
    await ctx.close();
  }

  // 6. 3D viewer on object 1: focusable, keyboard rotation
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await page.goto(BASE + OBJ1, { waitUntil: 'load' });
    await page.waitForTimeout(6000);
    const v = await page.$('.viewer3d__canvas');
    out.viewer3d = { present: !!v, hidden: await page.evaluate(() => document.getElementById('viewer3d').hidden) };
    if (v && !out.viewer3d.hidden) {
      await v.focus();
      out.viewer3d.focus = await page.evaluate(describe);
      await shotFocus(page, 'k-3d-viewer-focus.png', 10);
    }
    await ctx.close();
  }

  // 7. Mobile menu at 375 px: open with keyboard, Escape, focus
  {
    const ctx = await browser.newContext({ ...ctxOpts, viewport: { width: 375, height: 740 } });
    const page = await ctx.newPage();
    await page.goto(BASE + 'index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.focus('.nav-toggle');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const seq = [await page.evaluate(describe)];
    for (let i = 0; i < 7; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(60); seq.push(await page.evaluate(describe)); }
    await page.screenshot({ path: path.join(SHOTS, 'k-mobile-menu-open.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    out.mobileMenu = { sequence: seq, expandedAfterEscape: await page.evaluate(() => document.querySelector('.nav-toggle').getAttribute('aria-expanded')) };
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log('done');
})();
