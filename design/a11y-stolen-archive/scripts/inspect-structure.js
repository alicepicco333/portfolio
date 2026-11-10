// Structure checks per page: title, lang, headings, landmarks, images and alt text,
// controls and their names and states, tabs, live regions, skip link.
// Usage: node inspect-structure.js <node_modules dir> <out.json>
const path = require('path');
const fs = require('fs');
const NM = process.argv[2] || 'C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules';
const OUT = process.argv[3] || path.join(__dirname, 'structure.json');
const { chromium } = require(path.join(NM, 'playwright'));
const BASE = process.env.BASE || ('https://alicepicco333.' + 'github.io/the-stolen-archive/'); // BASE=http://127.0.0.1:3003/ to test a local copy
const SAMPLE = [
  ['home', 'index.html'],
  ['collection', 'collection.html'],
  ['tours', 'tours.html'],
  ['atlas', 'atlas.html'],
  ['object-001', 'Object-page.html?no=1&tour=Timeline%20Tour&length=short&complexity=fun'],
  ['object-024', 'Object-page.html?no=24&tour=Geo%20Tour&length=long&complexity=expert'],
  ['about', 'about.html'],
  ['documentation', 'documentation.html'],
];

(async () => {
  const browser = await chromium.launch();
  const out = {};
  for (const [id, p] of SAMPLE) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: 'a11y-audit-script (Playwright Chromium)' });
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
    out[id] = await page.evaluate(() => {
      const vis = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && !el.closest('[hidden]') && (r.width > 0 || r.height > 0); };
      const txt = (el) => (el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') || '').split(' ').map((i) => document.getElementById(i)?.textContent || '').join(' ') || el.textContent || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
      const sel = (el) => el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
      const res = { title: document.title, lang: document.documentElement.lang };
      res.headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].map((h) => ({ level: h.getAttribute('aria-level') || h.tagName[1], text: h.textContent.replace(/\s+/g, ' ').trim().slice(0, 80), visible: vis(h), hiddenFromAT: !!h.closest('[aria-hidden=true]') }));
      res.landmarks = [...document.querySelectorAll('header,nav,main,footer,aside,section[aria-label],section[aria-labelledby],[role=banner],[role=navigation],[role=main],[role=contentinfo],[role=complementary],[role=region],[role=search],form')].map((l) => ({ tag: l.tagName.toLowerCase(), role: l.getAttribute('role'), name: (l.getAttribute('aria-label') || (l.getAttribute('aria-labelledby') ? document.getElementById(l.getAttribute('aria-labelledby'))?.textContent : '') || '').replace(/\s+/g, ' ').trim().slice(0, 60), insideMain: !!l.parentElement?.closest('main') }));
      res.images = [...document.querySelectorAll('img')].map((i) => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), visible: vis(i), inLink: !!i.closest('a,button'), linkName: i.closest('a,button') ? txt(i.closest('a,button')).slice(0, 80) : null }));
      res.roleImg = [...document.querySelectorAll('[role=img],svg')].filter((e) => !e.closest('[aria-hidden=true]') && e.getAttribute('aria-hidden') !== 'true').map((e) => ({ sel: sel(e), role: e.getAttribute('role'), name: txt(e).slice(0, 160), focusableInside: e.querySelectorAll('a[href],button,[tabindex]:not([tabindex="-1"])').length }));
      const controls = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex],[role=button],[role=tab],[role=link]')].filter((e) => !e.closest('[hidden]'));
      res.controls = controls.map((c) => ({ tag: c.tagName.toLowerCase(), role: c.getAttribute('role'), name: txt(c).slice(0, 90), visibleText: (c.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60), href: c.getAttribute('href'), pressed: c.getAttribute('aria-pressed'), selected: c.getAttribute('aria-selected'), expanded: c.getAttribute('aria-expanded'), current: c.getAttribute('aria-current'), controls: c.getAttribute('aria-controls'), tabindex: c.getAttribute('tabindex'), visible: vis(c), inRoleImg: !!c.parentElement?.closest('[role=img]'), cls: (typeof c.className === 'string' ? c.className : c.className?.baseVal || '').slice(0, 60) }));
      res.unnamedControls = res.controls.filter((c) => !c.name);
      // links with the same name going to different places
      const byName = {};
      res.controls.filter((c) => c.tag === 'a' && c.visible).forEach((c) => { (byName[c.name] ??= new Set()).add(c.href); });
      res.sameNameDifferentTarget = Object.entries(byName).filter(([, s]) => s.size > 1).map(([n, s]) => ({ name: n, hrefs: [...s].slice(0, 5) }));
      res.tabs = [...document.querySelectorAll('[role=tablist]')].map((tl) => ({ name: txt(tl), tabs: [...tl.querySelectorAll('[role=tab]')].map((t) => ({ text: t.textContent.replace(/\s+/g, ' ').trim(), selected: t.getAttribute('aria-selected'), controls: t.getAttribute('aria-controls'), controlsExists: !!(t.getAttribute('aria-controls') && document.getElementById(t.getAttribute('aria-controls'))), tabindex: t.getAttribute('tabindex') })) }));
      res.tabpanels = [...document.querySelectorAll('[role=tabpanel]')].map((p) => ({ sel: sel(p), labelledby: p.getAttribute('aria-labelledby'), label: p.getAttribute('aria-label'), tabindex: p.getAttribute('tabindex') }));
      res.live = [...document.querySelectorAll('[aria-live],[role=status],[role=alert],[role=log]')].map((l) => ({ sel: sel(l), live: l.getAttribute('aria-live'), role: l.getAttribute('role'), textLen: l.textContent.trim().length }));
      res.dialogs = [...document.querySelectorAll('[role=dialog],dialog')].map((d) => ({ sel: sel(d), modal: d.getAttribute('aria-modal'), name: txt(d).slice(0, 60), hidden: d.hidden }));
      const skip = document.querySelector('.skip-link');
      res.skip = skip ? { href: skip.getAttribute('href'), target: !!document.querySelector(skip.getAttribute('href')), targetTabindex: document.querySelector(skip.getAttribute('href'))?.getAttribute('tabindex') } : null;
      res.langParts = [...document.querySelectorAll('[lang]')].filter((e) => e !== document.documentElement).map((e) => ({ sel: sel(e), lang: e.getAttribute('lang') })).slice(0, 20);
      res.counts = { links: controls.filter((c) => c.tagName === 'A').length, buttons: controls.filter((c) => c.tagName === 'BUTTON').length, tabStops: controls.filter((c) => vis(c) && c.tabIndex >= 0 && !c.disabled).length };
      return res;
    });
    console.log(id, out[id].title, '| lang', out[id].lang, '| h', out[id].headings.length, '| unnamed', out[id].unnamedControls.length, '| tabStops', out[id].counts.tabStops);
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
})();
