// Checks the preview (serve.js, http://127.0.0.1:5192) at several widths, each page loaded fresh:
// console errors, text contrast, keyboard focus, and the spacing the design review asked for.
//   node tools/check.js <out-dir> [pages] [widths]
//   node tools/check.js C:/tmp/checks home,visualizations 1440x900,1280x800,390x844
const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright');

const BASE = 'http://127.0.0.1:5192';
const out = process.argv[2];
const pages = (process.argv[3] || 'home,visualizations,thesis,sparql').split(',');
const sizes = (process.argv[4] || '1440x900,1280x800,390x844').split(',').map((s) => s.split('x').map(Number));
const PATHS = { home: '/', visualizations: '/visualizations', thesis: '/thesis', sparql: '/sparql',
  dataset: '/visualizations#dataset', ontology: '/visualizations#ontology', about: '/visualizations#about' };
fs.mkdirSync(out, { recursive: true });

(async () => {
  const b = await chromium.launch();
  for (const [w, h] of sizes) {
    for (const name of pages) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, userAgent: 'memo-design-study' });
      const p = await ctx.newPage();
      const errors = [];
      p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });
      p.on('pageerror', (e) => errors.push('pageerror ' + e.message.slice(0, 140)));
      p.on('console', (m) => { if (m.type() === 'warning' && m.text().includes('memo-refine')) errors.push('refine ' + m.text().slice(0, 140)); });
      p.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url().replace(BASE, '').slice(0, 90)}`); });
      await p.goto(BASE + PATHS[name], { waitUntil: 'load', timeout: 120000 });
      await p.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await p.waitForTimeout(2500);
      await p.screenshot({ path: path.join(out, `${name}-${w}.png`) });
      if (name === 'visualizations') {
        // every chart must draw with the new layout: scroll through, then count marks per chart
        await p.evaluate(async () => {
          for (const s of document.querySelectorAll('main#app > section')) { s.scrollIntoView(); await new Promise((r) => setTimeout(r, 1200)); }
          window.scrollTo(0, 0);
        });
        console.log('charts:', JSON.stringify(await p.$$eval('.graph-wrap', (ws) => ws.map((x) => x.id.replace('graph-', '') + ':' + x.querySelectorAll('svg *,canvas,img').length + '@' + Math.round(x.getBoundingClientRect().width) + 'x' + Math.round(x.getBoundingClientRect().height)))));
      }

      // contrast of visible text against the nearest painted background (images skipped)
      const lowContrast = await p.evaluate(() => {
        const parse = (c) => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : null; };
        const lum = ([r, g, bl]) => [r, g, bl].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
          .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
        const ratio = (a, c) => { const x = lum(a), y = lum(c); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
        const bgOf = (el) => {
          for (let e = el; e; e = e.parentElement) {
            const cs = getComputedStyle(e);
            if (cs.backgroundImage !== 'none' && !cs.backgroundImage.includes('gradient')) return null;
            const c = parse(cs.backgroundColor);
            if (c && (c.length < 4 || c[3] > 0.9)) return c;
          }
          return [255, 255, 255];
        };
        const bad = [];
        const seen = new Set();
        for (const el of document.querySelectorAll('body *')) {
          if (el.closest('svg') || el.closest('.hidden') || el.closest('[aria-hidden="true"]')) continue;
          const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          if (!own) continue;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight * 3) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
          const fg = parse(cs.color); const bg = bgOf(el);
          if (!fg || !bg) continue;
          const large = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
          const cr = ratio(fg, bg);
          if (cr < (large ? 3 : 4.5)) {
            const key = el.className + cs.color;
            if (seen.has(key)) continue;
            seen.add(key);
            bad.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)} "${el.textContent.trim().slice(0, 30)}" ${cr.toFixed(2)}`);
          }
        }
        return bad.slice(0, 12);
      });

      // keyboard: the first 14 tab stops, each must show a focus outline and be on screen
      const focus = [];
      await p.evaluate(() => { window.scrollTo(0, 0); const a = document.querySelector('.topnav-brand'); if (a) { a.focus(); a.blur(); } });
      const stops = name === 'visualizations' ? 44 : 14;
      for (let i = 0; i < stops; i++) {
        await p.keyboard.press('Tab');
        focus.push(await p.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return 'body';
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
          return `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''}:${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 18)}${ring ? '' : ' NO-RING'} ${Math.round(r.height)}px`;
        }));
      }

      // spacing
      const m = await p.evaluate((nm) => {
        const R = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const o = {};
        if (nm === 'home') {
          const t = R('.hero-title'), tg = R('.hero-tagline'), cta = R('.hero-cta'), hc = R('.hero-content'),
            so = R('.collage-sort'), no = R('.collage-sort-note'), wall = R('#hero-images'), tiles = [...document.querySelectorAll('.home-tile')].slice(0, 8).map((x) => x.getBoundingClientRect());
          o['title>tagline'] = Math.round(tg.top - t.bottom);
          o['tagline>button'] = Math.round(cta.top - tg.bottom);
          o['ground>arrange'] = Math.round(so.top - hc.bottom);
          o['arrange>note (same line if 0)'] = Math.round(no.top - so.bottom);
          o['note>wall'] = Math.round(wall.top - Math.max(no.bottom, so.bottom));
          o['wall left / first tile x'] = `${Math.round(wall.left)} / ${Math.round(tiles[0].left)}`;
          o['gutter'] = tiles[1] ? Math.round(tiles[1].left - tiles[0].right) : '-';
          o['arrange x / note right'] = `${Math.round(so.left)} / ${Math.round(innerWidth - no.right)}`;
          o['tile sizes'] = tiles.slice(0, 4).map((r) => `${Math.round(r.width)}x${Math.round(r.height)}`).join(' ');
        }
        if (nm === 'visualizations') {
          const s1 = R('#sec-time'), s2 = R('#sec-popularity'), h2 = R('#sec-time .sec-header h2'), hd = R('#sec-time .sec-header'), g = R('#graph-time');
          o['section gap'] = s2 ? Math.round(s2.top - s1.bottom) : '-';
          const fam = R('#sec-family'), sp = R('#sec-variant-gallery');
          o['gap before new group (family)'] = fam && sp ? Math.round(fam.top - sp.bottom) : '-';
          o['section top > first text'] = Math.round(R('#sec-time .viz-group-label').top - s1.top);
          o['header > chart'] = Math.round(g.top - hd.bottom);
          o['chart right edge to window'] = Math.round(innerWidth - g.right);
          o['title size'] = getComputedStyle(document.querySelector('#sec-time .sec-header h2')).fontSize;
          const pt = R('#graph-platform-time'), ph = R('#sec-platform-time .sec-header');
          o['split (platform): text w / chart x,w,h'] = pt && ph ? `${Math.round(ph.width)} / ${Math.round(pt.left)},${Math.round(pt.width)},${Math.round(pt.height)}` : '-';
          const sw = R('#graph-spectrum');
          o['spectrum right edge'] = sw ? Math.round(innerWidth - sw.right) : '-';
          const dn = R('#dot-nav');
          o['contents width'] = dn ? Math.round(dn.width) : '-';
          o['scroll width overflow'] = document.documentElement.scrollWidth - innerWidth;
        }
        o['horizontal overflow px'] = document.documentElement.scrollWidth - innerWidth;
        return o;
      }, name);

      console.log(`\n== ${name} ${w}x${h}`);
      console.log('errors:', errors.length ? errors.join(' | ') : 'none');
      console.log('low contrast:', lowContrast.length ? lowContrast.join(' | ') : 'none');
      console.log('tab:', focus.join(' > '));
      console.log('spacing:', JSON.stringify(m));
      await ctx.close();
    }
  }
  await b.close();
})();
