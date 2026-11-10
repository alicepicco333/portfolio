/* Shared helpers for direction B. Each meme = one square in its average colour. */
window.B = (function () {
  var M = window.MEMO;
  var rows = M.corpus.map(function (r, i) {
    return {
      i: i, slug: r[0], year: r[1], h: r[2], s: r[3], l: r[4],
      format: M.formats[r[5]], platform: M.platforms[r[6]], type: M.imageTypes[r[7]], views: r[8]
    };
  });
  var SMALL = { a: 1, an: 1, and: 1, the: 1, of: 1, in: 1, on: 1, to: 1, is: 1, at: 1, for: 1, vs: 1 };
  function title(slug) {
    return slug.split('-').map(function (w, i) {
      if (i && SMALL[w]) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }
  function colour(r) { return 'hsl(' + r.h + ',' + r.s + '%,' + r.l + '%)'; }
  // hue order with greys pushed to the end, as on the live site
  function hueKey(r) { return r.s < 12 ? 400 + (100 - r.l) : r.h; }
  // within a column: coloured squares in hue order on top, then greys from dark to light
  function colKey(r) { return r.s >= 22 ? r.h : 400 + r.l; }

  var tip;
  function showTip(html, x, y) {
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip); }
    tip.innerHTML = html; tip.style.display = 'block';
    var w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(x + 14, innerWidth - w - 8) + 'px';
    tip.style.top = Math.min(y + 14, innerHeight - h - 8) + 'px';
  }
  function hideTip() { if (tip) tip.style.display = 'none'; }
  function fmt(n) { return n.toLocaleString('en-GB'); }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { rows: rows, title: title, colour: colour, hueKey: hueKey, colKey: colKey, showTip: showTip, hideTip: hideTip, fmt: fmt, reduce: reduce, M: M };
})();
