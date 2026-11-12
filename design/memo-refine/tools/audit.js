// Computed-style audit of the live site: every visible border, box shadow, decorative pseudo-element and
// spaced-capitals label, grouped by element. Run before and after the override to count what is left.
//
//   node tools/audit.js -  home,visualizations,thesis,sparql 1440 > audit-before.json
//   node tools/audit.js memo-refine.css home,visualizations,thesis,sparql 1440 > audit-after.json
const fs = require('fs');
const { chromium } = require('C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright');
const BASE = 'https://thememeontology.netlify.app';
const cssPath = process.argv[2] && process.argv[2] !== '-' ? process.argv[2] : null;
const pages = (process.argv[3] || 'home,visualizations,thesis,sparql').split(',');
const width = +(process.argv[4] || 1440);

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width, height: 900 }, userAgent: 'memo-design-study' });
  const p = await ctx.newPage();
  const out = {};
  for (const name of pages) {
    await p.goto(BASE + (name === 'home' ? '/' : '/' + name), { waitUntil: 'networkidle', timeout: 90000 });
    if (cssPath) await p.addStyleTag({ content: fs.readFileSync(cssPath, 'utf8') });
    await p.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(800);
    out[name] = await p.evaluate(() => {
      const sel = (el) => {
        let s = el.tagName.toLowerCase();
        if (el.id) s += '#' + el.id;
        if (el.classList.length) s += '.' + [...el.classList].slice(0, 3).join('.');
        return s;
      };
      const path = (el) => {
        const parts = [];
        let e = el;
        for (let i = 0; i < 3 && e && e !== document.body; i++) { parts.unshift(sel(e)); e = e.parentElement; }
        return parts.join(' > ');
      };
      const vis = (c) => c && c !== 'transparent' && !/rgba\(\d+, \d+, \d+, 0\)/.test(c);
      const groups = {};
      const add = (k, info) => { (groups[k] = groups[k] || { n: 0, ex: info }).n++; };
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
        const sides = ['top', 'right', 'bottom', 'left'].filter(s => parseFloat(cs[`border-${s}-width`]) > 0 && cs[`border-${s}-style`] !== 'none' && vis(cs[`border-${s}-color`]));
        const shadow = cs.boxShadow !== 'none' ? cs.boxShadow : '';
        const caps = cs.textTransform === 'uppercase' && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        const ls = parseFloat(cs.letterSpacing) || 0;
        const fsz = parseFloat(cs.fontSize);
        if (sides.length) add('BORDER ' + path(el) + ' [' + sides.join(',') + ']', { color: cs.borderTopColor + ' / ' + cs.borderBottomColor, w: sides.map(s => cs[`border-${s}-width`]).join(' '), size: Math.round(r.width) + 'x' + Math.round(r.height), y: Math.round(r.top + scrollY) });
        if (shadow) add('SHADOW ' + path(el), { shadow, size: Math.round(r.width) + 'x' + Math.round(r.height) });
        if (caps && ls / fsz > 0.05) add('CAPS ' + path(el), { font: cs.fontFamily.split(',')[0], size: cs.fontSize, ls: cs.letterSpacing, color: cs.color, text: el.textContent.trim().slice(0, 50) });
        for (const pe of ['::before', '::after']) {
          const ps = getComputedStyle(el, pe);
          if (ps.content && ps.content !== 'none' && ps.content !== 'normal') {
            if (vis(ps.backgroundColor) || (parseFloat(ps.borderTopWidth) > 0 && ps.borderTopStyle !== 'none') || (parseFloat(ps.borderBottomWidth) > 0 && ps.borderBottomStyle !== 'none'))
              add('PSEUDO ' + path(el) + pe, { content: ps.content.slice(0, 30), bg: ps.backgroundColor, w: ps.width, h: ps.height, bt: ps.borderTopWidth, bb: ps.borderBottomWidth });
            else if (ps.content.length > 2 && ps.content !== '""') add('PSEUDOTXT ' + path(el) + pe, { content: ps.content.slice(0, 40), font: ps.fontFamily.split(',')[0] });
          }
        }
      }
      return groups;
    });
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
