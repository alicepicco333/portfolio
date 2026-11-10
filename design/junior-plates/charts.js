// Vector figures for the plates, drawn from the decks' numbers (sources in each function).
const NS = 'http://www.w3.org/2000/svg';
const C = { ink: '#0E0E10', bone: '#D5D6DB', paper: '#ECEDF0', graphite: '#55555E', concrete: '#A5A6AE', green: '#2a6236', glow: '#8BE3A8' };

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}
function txt(parent, x, y, s, attrs = {}) { const t = el('text', { x, y, ...attrs }, parent); t.textContent = s; return t; }
function setup(id) {
  const s = document.getElementById(id);
  const w = s.clientWidth || +s.getAttribute('width'), h = s.clientHeight || +s.getAttribute('height');
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  return { s, w, h };
}
// Catmull-Rom through the points, as a smooth path
function smooth(pts, t = 0.5) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t / 3, p1[1] + (p2[1] - p0[1]) * t / 3];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t / 3, p2[1] - (p3[1] - p1[1]) * t / 3];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}
const poly = pts => 'M' + pts.map(p => p.join(',')).join(' L');

// A simple x/y frame: returns scale functions
function frame(g, { x0, y0, w, h, xmin, xmax, ymin, ymax, xticks = [], yticks = [], xlab, ylab, xfmt = v => v, yfmt = v => v, color = C.graphite, rule = C.concrete }) {
  const X = v => x0 + (v - xmin) / (xmax - xmin) * w, Y = v => y0 + h - (v - ymin) / (ymax - ymin) * h;
  el('line', { x1: x0, y1: y0 + h, x2: x0 + w, y2: y0 + h, stroke: color, 'stroke-width': 1 }, g);
  for (const v of yticks) {
    if (v !== ymin) el('line', { x1: x0, y1: Y(v), x2: x0 + w, y2: Y(v), stroke: rule, 'stroke-width': 1, 'stroke-dasharray': '2 4' }, g);
    txt(g, x0 - 8, Y(v) + 4, yfmt(v), { class: 'm', 'font-size': 11.5, fill: color, 'text-anchor': 'end' });
  }
  for (const v of xticks) txt(g, X(v), y0 + h + 18, xfmt(v), { class: 'm', 'font-size': 11.5, fill: color, 'text-anchor': 'middle' });
  if (xlab) txt(g, x0 + w, y0 + h + 38, xlab, { class: 'm', 'font-size': 11.5, fill: color, 'text-anchor': 'end' });
  if (ylab) txt(g, x0, y0 - 12, ylab, { class: 'm', 'font-size': 11.5, fill: color, 'text-anchor': 'start' });
  return { X, Y };
}

// ---------------------------------------------------------------- plate 1: spikes bursting through a grid
// Our own drawing after the "spikes bursting through grid" marker concept in the Sandia report (Trauth et al., 1993).
function spikes(id) {
  const { s, w, h } = setup(id);
  const g = el('g', {}, s);
  const hz = h * 0.30;  // horizon
  const P = (u, v) => {  // ground point: u across (-1..1), v depth (0 near .. 1 far)
    const z = 1 / (1 + v * 3.2);
    return [w / 2 + u * w * 0.62 * z, hz + (h - hz) * z];
  };
  const gridc = '#3d3d45';
  for (let i = 0; i <= 16; i++) { const v = i / 16, a = P(-1.6, v), b = P(1.6, v); el('line', { x1: Math.max(0, a[0]), y1: a[1], x2: Math.min(w, b[0]), y2: b[1], stroke: gridc, 'stroke-width': 1 }, g); }
  for (let i = -12; i <= 12; i++) { const u = i / 7.5, a = P(u, 0), b = P(u, 1); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: gridc, 'stroke-width': 1 }, g); }
  el('rect', { x: -2, y: 0, width: 2, height: h, fill: '#0E0E10' }, g);
  const sp = [[-.75, .06, 1], [-.2, .02, 1.1], [.45, .1, .95], [.95, .05, .9], [-1.05, .28, .9], [-.45, .3, 1], [.15, .26, 1.05], [.7, .33, .9], [1.25, .3, .85],
    [-.8, .52, .85], [-.1, .55, .9], [.5, .6, .85], [1.05, .62, .8], [-1.3, .7, .75], [-.45, .78, .8], [.25, .85, .75], [.85, .92, .7], [-.95, .98, .7], [1.4, .95, .65]];
  sp.sort((a, b) => b[1] - a[1]);
  for (const [u, v, k] of sp) {
    const [x, y] = P(u, v), z = 1 / (1 + v * 3.2), H = h * 0.62 * z * k, W = 15 * z * k;
    if (x - W < 0 || x + W > w) continue;
    el('path', { d: `M${x - W},${y} L${x},${y - H} L${x + W},${y} Z`, fill: '#D5D6DB' }, g);
    el('path', { d: `M${x},${y - H} L${x + W},${y} L${x + W * .2},${y} Z`, fill: '#8a8b92' }, g);
  }
}

// ---------------------------------------------------------------- plate 3: the signals map (midterm, slide 5)
const SIGNALS = [  // [number, angle in degrees from "up", clockwise; distance from now, 0..1], read off the midterm slide
  [1, -10.9, .51], [2, -35, .43], [3, -55.9, .55], [4, -79.5, .84], [5, -100.4, .41], [6, -124.6, .50], [7, -145.2, .46], [8, -169.2, .67],
  [9, 169.8, .57], [10, 145.7, .47], [11, 125, .43], [12, 100.5, .51], [13, 79.9, .44], [14, 55.3, .86], [15, 33.9, .72], [16, 10.5, .55]];
const AXES = [['Technological', -22.5], ['Environmental', 22.5], ['Economic', 67.5], ['Historical', 112.5], ['Other', 157.5], ['Cultural', -157.5], ['Social', -112.5], ['Political', -67.5]];
function radar(id) {
  const { s, w, h } = setup(id);
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 58;
  const pt = (a, r) => [cx + Math.sin(a * Math.PI / 180) * r, cy - Math.cos(a * Math.PI / 180) * r];
  for (const f of [.25, .5, .75, 1]) el('circle', { cx, cy, r: R * f, fill: 'none', stroke: C.concrete, 'stroke-width': 1 }, s);
  for (let a = 0; a < 360; a += 45) { const p = pt(a, R), q = pt(a, R * .14); el('line', { x1: q[0], y1: q[1], x2: p[0], y2: p[1], stroke: C.concrete, 'stroke-width': 1 }, s); }
  for (const [name, a] of AXES) {
    const [x, y] = pt(a, R + 26);
    txt(s, x, y + 4, name, { class: 'm', 'font-size': 13, fill: C.graphite, 'text-anchor': Math.abs(Math.sin(a * Math.PI / 180)) < .3 ? 'middle' : (Math.sin(a * Math.PI / 180) > 0 ? 'start' : 'end'), 'letter-spacing': '.04em' });
  }
  el('circle', { cx, cy, r: R * .13, fill: C.ink }, s);
  txt(s, cx, cy + 5, 'now', { class: 'm', 'font-size': 14, fill: C.bone, 'text-anchor': 'middle' });
  for (const [n, a, r] of SIGNALS) {
    const [x, y] = pt(a, r * R);
    el('circle', { cx: x, cy: y, r: 15, fill: C.green }, s);
    txt(s, x, y + 4.5, n, { class: 'm', 'font-size': 13, 'font-weight': 700, fill: '#fff', 'text-anchor': 'middle' });
  }
}

// ---------------------------------------------------------------- plate 4: three charts
// Light at the planet: the Sun at Earth vs Proxima Centauri at planet b. Redrawn after Meadows et al. (2018), Fig. 1
// (smoothed, read off the figure; mW/m2/nm).
const SUN = [[250, 0], [300, 300], [350, 900], [400, 1450], [440, 1900], [480, 2150], [520, 2050], [600, 1780], [700, 1450], [800, 1150], [900, 900], [1000, 740], [1100, 620], [1250, 480], [1500, 320], [1750, 210], [2000, 140], [2200, 95], [2400, 60]];
const PROX = [[250, 0], [500, 20], [600, 50], [700, 140], [760, 280], [820, 470], [900, 700], [980, 860], [1050, 900], [1150, 880], [1300, 800], [1450, 640], [1600, 560], [1700, 540], [1800, 380], [1950, 290], [2100, 250], [2400, 200]];
function spectrum(id) {
  const { s, w, h } = setup(id);
  const f = frame(s, { x0: 56, y0: 30, w: w - 72, h: h - 82, xmin: 0, xmax: 2500, ymin: 0, ymax: 2400, xticks: [0, 500, 1000, 1500, 2000, 2500], yticks: [0, 1000, 2000], xlab: 'wavelength, nm', ylab: 'mW/m²/nm' });
  // visible light band
  el('rect', { x: f.X(380), y: 30, width: f.X(750) - f.X(380), height: h - 82, fill: C.paper }, s);
  txt(s, f.X(565), f.Y(650), 'visible', { class: 'm', 'font-size': 12, fill: C.ink, 'text-anchor': 'middle' }); txt(s, f.X(565), f.Y(650) + 15, 'to us', { class: 'm', 'font-size': 12, fill: C.ink, 'text-anchor': 'middle' });
  txt(s, f.X(1150), h - 62, 'near-infrared →', { class: 'm', 'font-size': 12, fill: C.graphite, 'text-anchor': 'start' });
  // redraw the axis on top of the band
  el('line', { x1: 56, y1: h - 52, x2: w - 16, y2: h - 52, stroke: C.graphite }, s);
  el('path', { d: smooth(SUN.map(([x, y]) => [f.X(x), f.Y(y)])), fill: 'none', stroke: C.graphite, 'stroke-width': 2 }, s);
  el('path', { d: smooth(PROX.map(([x, y]) => [f.X(x), f.Y(y)])), fill: 'none', stroke: C.ink, 'stroke-width': 3.5 }, s);
  txt(s, f.X(560), f.Y(2180), 'the Sun, at Earth', { 'font-size': 15, fill: C.graphite });
  txt(s, f.X(1180), f.Y(1000), 'Proxima Centauri, at planet b', { 'font-size': 15, 'font-weight': 600, fill: C.ink });
}
// Proxima's 2016 superflare. Redrawn after Howard et al. (2018), Fig. 1 (normalised flux over minutes).
const FLARE = [[-40, 1], [-20, 1], [-10, 1.1], [-8, 1.6], [-3, 8.5], [0, 37], [2, 18], [4, 9.5], [8, 6.2], [10, 4.6], [15, 3.4], [22, 2.9], [27, 3.1], [32, 2.4], [45, 2], [52, 2.4], [58, 1.8], [70, 1.5], [82, 1.2]];
function flare(id) {
  const { s, w, h } = setup(id);
  const f = frame(s, { x0: 36, y0: 24, w: w - 46, h: h - 74, xmin: -40, xmax: 85, ymin: 0, ymax: 40, xticks: [-40, 0, 40, 80], yticks: [0, 20, 40], xlab: 'minutes', ylab: 'brightness, × normal' });
  el('path', { d: poly(FLARE.map(([x, y]) => [f.X(x), f.Y(y)])) + ` L${f.X(82)},${f.Y(0)} L${f.X(-40)},${f.Y(0)} Z`, fill: C.paper }, s);
  el('path', { d: poly(FLARE.map(([x, y]) => [f.X(x), f.Y(y)])), fill: 'none', stroke: C.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, s);
  txt(s, f.X(4), f.Y(34), 'peak: 37 × in minutes', { 'font-size': 13.5, fill: C.ink });
  txt(s, f.X(30), f.Y(8), 'then it fades', { 'font-size': 13.5, fill: C.graphite });
}
// Melanized fungal cells with and without radiation. Redrawn after Dadachova et al. (2007), Fig. 6a (CFU/mL, millions).
const IRR = [[0, .15], [18, .67], [23, 1.2], [30, 1.3]], NON = [[0, .15], [18, .43], [23, .54], [30, .56]];
function growth(id) {
  const { s, w, h } = setup(id);
  const f = frame(s, { x0: 36, y0: 24, w: w - 70, h: h - 74, xmin: 0, xmax: 30, ymin: 0, ymax: 1.5, xticks: [0, 10, 20, 30], yticks: [0, .5, 1, 1.5], xlab: 'hours', ylab: 'fungal cells, millions per mL', yfmt: v => v });
  for (const [data, col, wdt] of [[NON, C.graphite, 2], [IRR, C.green, 3.5]]) {
    el('path', { d: poly(data.map(([x, y]) => [f.X(x), f.Y(y)])), fill: 'none', stroke: col, 'stroke-width': wdt, 'stroke-linejoin': 'round' }, s);
    for (const [x, y] of data) el('circle', { cx: f.X(x), cy: f.Y(y), r: 4.5, fill: col }, s);
  }
  txt(s, f.X(29.5), f.Y(1.3) - 12, 'with radiation', { 'font-size': 13.5, 'font-weight': 600, fill: C.green, 'text-anchor': 'end' });
  txt(s, f.X(29.5), f.Y(.56) + 22, 'without', { 'font-size': 13.5, fill: C.graphite, 'text-anchor': 'end' });
}

// ---------------------------------------------------------------- plate 11: the palm switch, an illustrative trace
// After fsr-trace.png in the final deck, with today's thresholds (press at 800, re-arm at 200).
const TRACE = [[0, 0], [1, 0], [1.27, 870], [1.5, 905], [2.2, 850], [2.45, 470], [2.8, 410], [3.0, 860], [3.4, 885], [3.75, 200], [3.9, 110], [4.2, 0], [4.6, 0], [4.9, 915], [5.5, 895], [6, 870]];
function fsr(id) {
  const { s, w, h } = setup(id);
  const x0 = 58, cw = w - 268, top = 40, ch = h - 150;
  const f = frame(s, { x0, y0: top, w: cw, h: ch, xmin: 0, xmax: 6, ymin: 0, ymax: 1023, xticks: [0, 1, 2, 3, 4, 5, 6], yticks: [0, 200, 800, 1023], xlab: 'seconds, illustrative trace', ylab: 'palm FSR reading' });
  // threshold lines
  el('line', { x1: x0, y1: f.Y(800), x2: x0 + cw, y2: f.Y(800), stroke: C.green, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }, s);
  el('line', { x1: x0, y1: f.Y(200), x2: x0 + cw, y2: f.Y(200), stroke: C.ink, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }, s);
  // switches
  for (const t of [1.25, 4.86]) {
    el('line', { x1: f.X(t), y1: top - 6, x2: f.X(t), y2: top + ch, stroke: C.green, 'stroke-width': 1.5 }, s);
    txt(s, f.X(t) + 6, top + 6, 'M,0,0', { class: 'm', 'font-size': 12.5, 'font-weight': 700, fill: C.green });
  }
  el('path', { d: poly(TRACE.map(([x, y]) => [f.X(x), f.Y(y)])), fill: 'none', stroke: C.ink, 'stroke-width': 3, 'stroke-linejoin': 'round' }, s);
  el('circle', { cx: f.X(2.97), cy: f.Y(800), r: 6, fill: C.bone, stroke: C.ink, 'stroke-width': 2 }, s);
  txt(s, f.X(2.72), f.Y(1000), 'no switch:', { 'font-size': 14, 'font-weight': 600, fill: C.ink, 'text-anchor': 'middle' });
  txt(s, f.X(2.72), f.Y(1000) + 18, 'not released yet', { 'font-size': 14, fill: C.graphite, 'text-anchor': 'middle' });
  el('circle', { cx: f.X(3.75), cy: f.Y(200), r: 6, fill: C.ink }, s);
  txt(s, f.X(3.75) - 12, f.Y(200) + 24, 'ready again', { 'font-size': 14, 'font-weight': 600, fill: C.ink, 'text-anchor': 'end' });
  // zone labels on the right
  const lx = x0 + cw + 22;
  const zone = (y, a, b, col) => { txt(s, lx, y, a, { 'font-size': 15, 'font-weight': 600, fill: col }); txt(s, lx, y + 19, b, { 'font-size': 15, fill: C.graphite }); };
  zone(f.Y(800) - 4, '≥ 800: a press', 'switches the camera', C.green);
  zone((f.Y(800) + f.Y(200)) / 2, '200 to 800:', 'nothing changes', C.ink);
  zone(f.Y(200) + 8, '≤ 200: released,', 'ready again', C.ink);
  // which camera drives
  const by = top + ch + 50;
  txt(s, x0 - 8, by + 21, 'drives', { class: 'm', 'font-size': 12, fill: C.graphite, 'text-anchor': 'end' });
  const seg = (a, b, label, on) => {
    el('rect', { x: f.X(a) + 2, y: by, width: f.X(b) - f.X(a) - 4, height: 32, fill: on ? C.ink : 'none', stroke: C.ink, 'stroke-width': 1.5 }, s);
    txt(s, (f.X(a) + f.X(b)) / 2, by + 21, label, { class: 'm', 'font-size': 12.5, 'font-weight': 700, fill: on ? C.bone : C.ink, 'text-anchor': 'middle' });
  };
  seg(0, 1.25, 'VISOR', false); seg(1.25, 4.86, "JUNIOR'S CAMERA", true); seg(4.86, 6, 'VISOR', false);
}

// ---------------------------------------------------------------- dots: one dot per trial
function dots(id, n, on, cols, color, size = 13, gap = 6) {
  const { s } = setup(id);
  for (let i = 0; i < n; i++) {
    const x = (i % cols) * (size + gap) + size / 2 + 1, y = Math.floor(i / cols) * (size + gap) + size / 2 + 1;
    el('circle', { cx: x, cy: y, r: size / 2 - (i < on ? 0 : .75), fill: i < on ? color : 'none', stroke: i < on ? color : C.graphite, 'stroke-width': i < on ? 0 : 1.5 }, s);
  }
}

// ---------------------------------------------------------------- latency bars (plates 13 and 15)
function latency(id, rows, max = 2.5) {
  const { s, w, h } = setup(id);
  const x0 = 14, cw = w - 134, rh = (h - 30) / rows.length;
  const X = v => x0 + v / max * cw;
  for (const t of [0, .5, 1, 1.5, 2, 2.5].filter(t => t <= max)) {
    el('line', { x1: X(t), y1: 0, x2: X(t), y2: h - 24, stroke: C.concrete, 'stroke-width': 1, 'stroke-dasharray': t ? '2 4' : '' }, s);
    txt(s, X(t), h - 6, t + ' s', { class: 'm', 'font-size': 11.5, fill: C.graphite, 'text-anchor': 'middle' });
  }
  rows.forEach(([label, v, col, big], i) => {
    const y = i * rh + 8;
    txt(s, x0, y + 14, label, { 'font-size': 15, fill: C.ink });
    el('rect', { x: X(0), y: y + 24, width: Math.max(3, X(v) - X(0)), height: 22, fill: col }, s);
    txt(s, X(v) + 10, y + 42, big, { 'font-size': 26, 'font-weight': 700, 'letter-spacing': '-0.02em', fill: col });
  });
}
