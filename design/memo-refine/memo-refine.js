/* ══════════════════════════════════════════════════════════════════════════
   MEMO REFINE, markup layer (preview only)
   Stands in for the markup and copy changes the repository needs, so they can be seen on the live site
   through serve.js. It only adds, moves or rewrites elements after the site's own scripts have built them:
   it never removes anything a site script looks up later, and every patch is wrapped so a failure here
   cannot stop the site. The draft findings come from findings.json (served as window.MEMO_REFINE_FINDINGS).
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DATA = window.MEMO_REFINE_FINDINGS || null;
  var PHONE = window.matchMedia('(max-width: 768px)').matches;

  function safe(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn('[memo-refine] ' + name + ': ' + e.message); }
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ── Copy: sentence case, no " · " lists, no em-dashes ───────────────── */
  var EXACT = {
    // visualizations: groups, contents, dropdown, legend
    'Global Dataset Visualizations': 'Global dataset',
    'D0 Visualization': 'D0 sample',
    'Variant Visualization': 'Variants',
    'Interactive Explorations': 'Interactive explorations',
    'Temporal Format Distribution': 'Temporal format distribution',
    'Temporal Distribution of Format': 'Temporal distribution of format',
    'Popularity × Format': 'Popularity × format',
    'Platform Origin × TimePeriod': 'Platform origin × TimePeriod',
    'Creative Productivity × Cultural Prominence': 'Creative productivity × cultural prominence',
    'Variant Gallery': 'Variant gallery',
    'Variant Family Tree': 'Variant family tree',
    'Colour Spectrum': 'Colour spectrum',
    'Knowledge-Graph Walk': 'Knowledge-graph walk',
    'Platform Story': 'Platform story',
    'Classifier Confidence': 'Classifier confidence',
    'Property Flow': 'Property flow',
    'Eight Transformation Dimensions': 'Eight transformation dimensions',
    // sparql
    'Example Queries': 'Example queries',
    'Run Query': 'Run query',
    'Query the meme ontology — Local Document Stream · SPARQL 1.1': 'Query the meme ontology with SPARQL 1.1 (local document stream).',
    // about
    'At a Glance': 'At a glance',
    'Ontology Structure': 'Ontology structure',
    'Semantic Interoperability': 'Semantic interoperability',
    'Design Principles': 'Design principles',
    'Data Collection': 'Data collection',
    'CLIP Classification': 'CLIP classification',
    'OWL Generation': 'OWL generation',
    // dataset
    'Global Dataset': 'Global dataset',
    'D0 Sample': 'D0 sample',
    'Variant Dataset': 'Variant dataset',
    'D0 — Annotated Sample': 'D0: annotated sample',
    'Full meme collection · KYM': 'Full meme collection from Know Your Meme',
    // thesis
    "Master's dissertation · Digital Humanities and Digital Knowledge · Università di Bologna":
      "Master's dissertation in Digital Humanities and Digital Knowledge, Università di Bologna."
  };
  // a list joined by " · " becomes sentences
  function unDot(s) {
    var parts = s.split(/\s*·\s*/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (parts.length < 2) return s;
    return parts.map(function (p, i) {
      if (i > 0) p = p.charAt(0).toUpperCase() + p.slice(1);
      return /[.!?:;]$/.test(p) ? p : p + '.';
    }).join(' ');
  }
  function unDash(s) { return s.replace(/\s+—\s+/g, ', '); }

  // where each rule applies; the thesis text, chart data and triples are never touched
  var EXACT_SEL = '.viz-group-label, .topnav-dropdown-item, .transform-legend h3, .sidebar-label, .run-btn, ' +
    '.about-section h2, .pipeline-label, .stat-label, .ds-ov-label, .ds-ov-sub, .ds-sec-title, .editor-subtitle, .th-kicker, ' +
    '.sec-header h2';
  var DOT_SEL = '.collage-sort-note, .walk-hint, .th-title > p, .th-kicker, .ds-ov-sub';
  var DASH_SEL = '.query-status, .editor-subtitle';

  function textNodes(root) {
    var out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while (w.nextNode()) if (w.currentNode.nodeValue.trim()) out.push(w.currentNode);
    return out;
  }
  function rewrite(node, fn) {
    var v = node.nodeValue, t = v.trim(), n = fn(t);
    if (n !== t) node.nodeValue = v.replace(t, n);
  }
  function fixCopy(root) {
    root = root || document;
    root.querySelectorAll(EXACT_SEL).forEach(function (e) {
      var t = e.textContent.trim();
      if (EXACT[t] && e.children.length === 0) e.textContent = EXACT[t];
      else textNodes(e).forEach(function (n) { rewrite(n, function (s) { return EXACT[s] || s; }); });
    });
    root.querySelectorAll(DOT_SEL).forEach(function (e) { textNodes(e).forEach(function (n) { rewrite(n, unDot); }); });
    root.querySelectorAll(DASH_SEL).forEach(function (e) { textNodes(e).forEach(function (n) { rewrite(n, unDash); }); });
    // example queries: no "1." to "8."
    root.querySelectorAll('.ex-title').forEach(function (e) { textNodes(e).forEach(function (n) { rewrite(n, function (s) { return s.replace(/^\d+\.\s+/, ''); }); }); });
  }

  /* ── Chart labels the scripts set in capitals ────────────────────────── */
  function sentence(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }
  function fixChartLabels() {
    document.querySelectorAll('.flow-stage, .fam-ring-label').forEach(function (t) {
      var s = t.textContent;
      if (s && s === s.toUpperCase() && /[A-Z]/.test(s)) t.textContent = sentence(s);
    });
    document.querySelectorAll('.fam-caption').forEach(function (t) {
      var s = t.textContent;
      if (/^ORIGINAL\s+·\s+/.test(s)) t.textContent = s.replace(/^ORIGINAL\s+·\s+/, 'Original: ');
    });
  }

  /* ── Home ────────────────────────────────────────────────────────────── */
  function home() {
    // the ticker's script returns early when its element is missing, so it can go
    var ticker = document.querySelector('.home-ticker');
    if (ticker) ticker.remove();
  }

  /* ── Visualizations: opener, findings, contents, phone scroll boxes ─── */
  var GROUPS = { 'sec-time': 'Global dataset', 'sec-variant-bubble': 'D0 sample', 'sec-variant-gallery': 'Variants', 'sec-family': 'Interactive explorations' };
  var SPLIT = { 'sec-platform-time': 1, 'sec-family': 1, 'sec-walk': 1 };

  function opener(app) {
    if (document.getElementById('mr-opener')) return;
    var head = el('header', 'mr-opener');
    head.id = 'mr-opener';
    var banner = el('div', 'meme-banner');
    var strip = el('div', 'meme-banner-strip');
    strip.setAttribute('aria-hidden', 'true');
    var h1 = el('h1', 'meme-caption', (DATA && DATA.opener && DATA.opener.title) || 'Visualizations');
    banner.appendChild(strip);
    banner.appendChild(h1);
    head.appendChild(banner);
    if (DATA && DATA.opener && DATA.opener.text) head.appendChild(el('p', 'mr-opener-text', DATA.opener.text));
    app.insertBefore(head, app.firstElementChild);
    // the same strip the site builds for the about, dataset, thesis and SPARQL titles
    fetch('memes_lite.json').then(function (r) { return r.ok ? r.json() : []; }).then(function (list) {
      var pics = list.filter(function (m) { return !m.a && m.v > 5000; });
      var pool = pics.length ? pics : list;
      for (var i = 0, used = {}; i < 14 && i < pool.length; ) {
        var k = Math.floor(Math.random() * pool.length);
        if (used[k]) continue;
        used[k] = 1; i++;
        var img = el('img');
        img.src = /^https?:/.test(pool[k].i) ? pool[k].i : 'https://i.kym-cdn.com/' + pool[k].i;
        img.alt = '';
        img.decoding = 'async';
        img.onerror = function () { this.remove(); };
        strip.appendChild(img);
      }
    }).catch(function () {});
  }

  function finding(sec, f) {
    var header = sec.querySelector(':scope > .sec-header');
    if (!header || header.querySelector('.mr-finding')) return;
    var h2 = header.querySelector('h2');
    var sentence = header.querySelector('p');
    var box = el('div', 'mr-finding');
    box.appendChild(el('p', 'mr-finding-text', f.fact));
    if (f.memes && f.memes.length) {
      var ul = el('ul', 'mr-finding-memes');
      ul.setAttribute('aria-label', 'Memes that show it');
      f.memes.slice(0, 4).forEach(function (m) {
        var li = el('li'), a = el('a'), img = el('img');
        a.href = m.url;
        a.title = m.name;
        img.src = m.thumb;
        img.alt = m.name;
        img.width = 64; img.height = 64;
        img.loading = 'lazy';
        img.decoding = 'async';
        a.appendChild(img); li.appendChild(a); ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    h2.insertAdjacentElement('afterend', box);
    // the encoding sentence becomes a "How to read" line under the chart
    if (sentence) {
      var how = el('p', 'mr-howto');
      how.appendChild(el('span', 'mr-howto-label', 'How to read '));
      while (sentence.firstChild) how.appendChild(sentence.firstChild);
      sentence.remove();
      var after = sec.id === 'sec-variant-gallery' ? header
        : sec.querySelector(':scope > .story-body') || sec.querySelector(':scope > .mr-hscroll') || sec.querySelector(':scope > .graph-wrap');
      if (after) after.insertAdjacentElement('afterend', how);
      else header.appendChild(how);
    }
  }

  function split(sec) {
    if (sec.querySelector(':scope > .mr-col')) return;
    var col = el('div', 'mr-col');
    var items = sec.querySelectorAll(':scope > .viz-group-label, :scope > .sec-header, :scope > .viz-controls, :scope > .mr-howto');
    if (!items.length) return;
    sec.insertBefore(col, items[0]);
    items.forEach(function (i) { col.appendChild(i); });
    sec.classList.add('mr-split');
  }

  function scrollBox(id) {
    var wrap = document.getElementById(id);
    if (!wrap || wrap.parentElement.classList.contains('mr-hscroll')) return;
    var box = el('div', 'mr-hscroll');
    box.tabIndex = 0;
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Chart, scrolls sideways');
    wrap.parentElement.insertBefore(box, wrap);
    box.appendChild(wrap);
    box.insertAdjacentElement('afterend', el('p', 'mr-hscroll-hint', 'Scroll sideways to see the whole chart.'));
  }

  function contents() {
    var nav = document.getElementById('dot-nav');
    if (!nav || nav.querySelector('.mr-dot-group')) return;
    nav.querySelectorAll('.dot').forEach(function (a) {
      var id = (a.getAttribute('href') || '').slice(1);
      var label = a.getAttribute('data-label') || '';
      a.textContent = EXACT[label] || label;
      a.classList.add('mr-text');
      if (GROUPS[id]) nav.insertBefore(el('span', 'mr-dot-group', GROUPS[id]), a);
    });
  }

  function visualizations(app) {
    safe('opener', function () { opener(app); });
    safe('contents', contents);
    if (PHONE) ['graph-time', 'graph-popularity', 'graph-flow'].forEach(function (id) { safe('scroll ' + id, function () { scrollBox(id); }); });
    var byId = {};
    ((DATA && DATA.findings) || []).forEach(function (f) { byId[f.sectionId] = f; });
    app.querySelectorAll(':scope > .viz-section').forEach(function (sec) {
      safe('finding ' + sec.id, function () { if (byId[sec.id]) finding(sec, byId[sec.id]); });
      if (SPLIT[sec.id] && !PHONE) safe('split ' + sec.id, function () { split(sec); });
    });
    document.body.classList.add('mr-ready');
  }

  /* ── Thesis ──────────────────────────────────────────────────────────── */
  function thesis() {
    var title = document.querySelector('.th-title');
    if (!title) return;
    var kicker = title.querySelector('.th-kicker'), byline = title.querySelector(':scope > p');
    if (kicker && byline && byline.nextElementSibling !== kicker) byline.insertAdjacentElement('afterend', kicker);
    // "~143 min read": the tilde reads as a minus in Bricolage Grotesque
    title.querySelectorAll('.th-meta b').forEach(function (b) {
      if (/^~\s*\d/.test(b.textContent)) {
        b.textContent = b.textContent.replace(/^~\s*/, '');
        b.parentNode.insertBefore(document.createTextNode('about '), b);
      }
    });
  }

  /* ── Run ─────────────────────────────────────────────────────────────── */
  function start() {
    safe('home', function () { if (document.querySelector('.home-hero')) home(); });
    var app = document.getElementById('app');
    if (app && app.querySelector('.viz-section')) safe('visualizations', function () { visualizations(app); });
    safe('thesis', thesis);
    safe('copy', function () { fixCopy(document); });

    // content the site builds later (about, dataset, charts, status lines, the Arrange note)
    var queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        safe('copy', function () { fixCopy(document); });
        safe('chart labels', fixChartLabels);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  // loaded last in <body> (defer): the page is parsed and the site's scripts have run, but the 12 MB data
  // file the charts wait for has not arrived, so the charts measure the patched layout when they first draw
  if (document.readyState === 'loading' && !document.querySelector('.site-footer')) document.addEventListener('DOMContentLoaded', start);
  else start();
})();
