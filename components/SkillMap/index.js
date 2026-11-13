import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { NODES, EDGES, neighbours, nodeOf, labelOf, CLUSTERS, clusterOf, SKILL_NOTES, MAP } from "../Graph/data";
import { useIsomorphicLayoutEffect, useMotionOn, usePrefersReducedMotion, withBase } from "../../utils";
import { textWidth, overlapArea } from "../../utils/layout";
import { scramble, drawIn, motionOn } from "../../utils/motion";
import SkillScreen, { SCREEN } from "./SkillScreen";
// the statement (STATEMENT: plain text, and [phrase, skill] pairs that open the part of the map they name),
// the plain-key test, 1 to 5 for the first skill of each step, and whether the hero is on screen
import { STATEMENT, STATEMENT_TEXT, STEP_KEYS, plainKey, useInView } from "./shared";

const shortTitle = (title) => title.split(" - ")[0];
const mapTitle = (p) => p.short || shortTitle(p.title);
const HALO = { paintOrder: "stroke", stroke: "rgb(var(--bone))", strokeWidth: 6, strokeLinejoin: "round" };
const f1 = (v) => Math.round(v * 10) / 10;

// ——— desktop geometry ———
// G maps the map's design coordinates onto the stage. Positions stretch to the room the hero has;
// text and node sizes never do, so labels read the same on a laptop and on a wide monitor.
const G = { kx: 1, ky: 1, ox: 0, oy: 0, W: MAP.W, H: MAP.H };
const place = ([x, y]) => [G.ox + x * G.kx, G.oy + y * G.ky];
const pos = (id) => place(MAP.pos[id]);
const stageW = () => G.W;
// the hero's side margin: the page gutter, and on wide screens a centred 1600 px frame
const gutterOf = (vw) => Math.max(32, (vw - 1600) / 2 + 32);
const LABEL_SCALE = 16 / 18; // labels are drawn at 18 units: 16 px on screen

// a skill's point grows with the projects it carries, so the HCI side weighs most
const weightOf = (id) => nodeOf(id).work.length;
const nodeR = (id) => 4.5 + 1.6 * weightOf(id);
const labelDx = (id) => nodeR(id) + 13;
const labelW = (id, widths = {}) => widths[id] || textWidth(labelOf(id), 18) * 1.1;
// the step a skill belongs to (listening, ordering...) shows only on the open skill, as a blue tag over or
// under its label, on the side away from its picture: at rest the tags read as names of single skills
const VERB_SIZE = 14;
const VERB_GAP = 28;
const verbW = (c) => textWidth(c.label, VERB_SIZE, true) * 1.27;
const headOf = (c) => MAP.clusters[c.id];
const verbAt = (id, side) => {
  const [x, y] = pos(id);
  return [x + labelDx(id), y + MAP.label[id][1] + side * VERB_GAP];
};
const verbBox = (id, side) => {
  const [x, y] = verbAt(id, side);
  return [x - 8, y - 17, x + verbW(clusterOf(id)) + 8, y + 7];
};

function labelBox(id) {
  const [x, y] = pos(id);
  const dy = MAP.label[id][1];
  const left = x + labelDx(id);
  return [left - 10, y + dy - 18, left + labelW(id) + 10, y + dy + 7];
}
const nodeBox = (id) => {
  const [x, y] = pos(id);
  const r = nodeR(id) + 8;
  return [x - r, y - r, x + r, y + r];
};
const staticBoxes = () => [...NODES.map((n) => labelBox(n.id)), ...NODES.map((n) => nodeBox(n.id))];

// every skill with how far its own ink (point, label and, for a step's head, its verb) reaches on each
// side, in design units; `widths` are the labels' rendered lengths once the fonts are in
const itemsFor = (widths = {}) =>
  NODES.map((n) => {
    const [x, y] = MAP.pos[n.id];
    const dy = MAP.label[n.id][1];
    const r = nodeR(n.id);
    const it = { x, y, l: r, r: labelDx(n.id) + labelW(n.id, widths), t: Math.max(r, 18 - dy), b: Math.max(r, dy + 7) };
    const c = CLUSTERS.find((k) => headOf(k)[0] === n.id);
    if (c) {
      const side = headOf(c)[1];
      it.r = Math.max(it.r, labelDx(n.id) + verbW(c));
      if (side < 0) it.t = Math.max(it.t, VERB_GAP - dy + 17);
      else it.b = Math.max(it.b, dy + VERB_GAP + 7);
    }
    return it;
  });
// the stretch that makes the outermost ink span exactly `size`: positions scale, labels do not
function fitAxis(ITEMS, key, lo, hi, size) {
  const span = (k) => {
    let min = Infinity;
    let max = -Infinity;
    ITEMS.forEach((it) => {
      min = Math.min(min, it[key] * k - it[lo]);
      max = Math.max(max, it[key] * k + it[hi]);
    });
    return { min, max };
  };
  let a = 0.05;
  let b = 20;
  for (let i = 0; i < 60; i += 1) {
    const m = (a + b) / 2;
    const { min, max } = span(m);
    if (max - min > size) b = m;
    else a = m;
  }
  return { k: a, offset: -span(a).min };
}

// ——— links ———
// The map grows out of HCI: links are drawn from the end nearer to it. Links are straight lines.
const dist = ([a, b], [c, d]) => Math.hypot(a - c, b - d);
const RANK = Object.fromEntries([...NODES].sort((a, b) => dist(MAP.pos[a.id], MAP.pos.hci) - dist(MAP.pos[b.id], MAP.pos.hci)).map((n, i) => [n.id, i]));
const LINKS = EDGES.map(([a, b]) => (RANK[a] <= RANK[b] ? { a, b, key: `${a}-${b}` } : { a: b, b: a, key: `${a}-${b}` }));
const INCIDENT = Object.fromEntries(NODES.map((n) => [n.id, LINKS.filter((l) => l.a === n.id || l.b === n.id)]));
const ZERO = Object.fromEntries(NODES.map((n) => [n.id, [0, 0]]));
function curveD(link, offs = ZERO) {
  const [a, c, b] = curveOf(link, offs);
  return `M${f1(a[0])} ${f1(a[1])}Q${f1(c[0])} ${f1(c[1])} ${f1(b[0])} ${f1(b[1])}`;
}
// points along a link at rest, for keeping the card off the lines
const samplesOf = (link, n = 14) => {
  const [a, c, b] = curveOf(link);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
  });
};
function curveOf(link, offs = ZERO) {
  const [x1, y1] = pos(link.a);
  const [x2, y2] = pos(link.b);
  const a = [x1 + offs[link.a][0], y1 + offs[link.a][1]];
  const b = [x2 + offs[link.b][0], y2 + offs[link.b][1]];
  // straight links (Alice prefers them to curves): the control point sits halfway, so the
  // quadratic path, the pulses and the card placement all follow the straight line
  return [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b];
}

// ——— the card and the leaves ———
const grow = ([a, b, c, d], m) => [a - m, b - m, c + m, d + m];
const cost = (boxes, obstacles) => {
  let score = 0;
  boxes.forEach((b, i) => {
    if (b[0] < 8 || b[1] < 8 || b[2] > stageW() - 8 || b[3] > G.H - 8) score += 1e6;
    obstacles.forEach((o) => {
      score += overlapArea(b, o);
    });
    boxes.slice(i + 1).forEach((o) => {
      score += overlapArea(b, o) * 2;
    });
  });
  return score;
};

// The skill's picture sits beside the skill, with the skill on one of its corners (never in its middle): under
// or over the skill's label, reaching right or left. It takes the corner that covers the fewest other skills
// and labels, kept on the stage. The links are masked where they cross it, so it reads as a picture, not a
// thumbnail under lines.
// No text over a picture: no other skill's label or point may sit on it. Where the full size has no clear corner,
// the picture steps down in size until one is clear; the largest clear one wins.
const SCALES = [1, 0.85, 0.72, 0.6, 0.5];
function cardOptions(id) {
  const [x, y] = pos(id);
  const dy = MAP.label[id][1];
  const r = nodeR(id);
  // the margin covers the other skills' slow drift (DRIFT units at most)
  const others = NODES.filter((n) => n.id !== id).flatMap((n) => [grow(labelBox(n.id), 6), grow(nodeBox(n.id), 6)]);
  const out = [];
  SCALES.forEach((k) => {
    const W = Math.round(SCREEN.w * k);
    const H = Math.round(SCREEN.h * k);
    const under = y + dy + 14; // the label's foot is at y + dy + 7
    const over = y + dy - 24 - H; // its top is at y + dy - 18
    // sx, sy: which way the picture moves when it slides away from the skill to find a clear spot
    const options = [
      { l: x - r - 4, t: under, bias: 0, sx: 1, sy: 1 }, // the skill on the picture's top-left corner
      { l: x + r + 4 - W, t: under, bias: 30, sx: -1, sy: 1 }, // top-right: the picture to the left, the label outside it
      { l: x - r - 4, t: over, bias: 60, sx: 1, sy: -1 }, // bottom-left
      { l: x + r + 4 - W, t: over, bias: 90, sx: -1, sy: -1 }, // bottom-right
    ];
    // side: where the step tag goes, away from the picture (1 under the label, -1 over it)
    options.forEach(({ l: c0, t: r0, bias, sx, sy }) => {
      [0, 30, 60, 90].forEach((ox) => {
        [0, 30, 60, 90].forEach((oy) => {
          const l0 = c0 + sx * ox;
          const t0 = r0 + sy * oy;
          const l = Math.min(Math.max(l0, 6), stageW() - W - 6);
          const t = Math.min(Math.max(t0, 6), G.H - H - 6);
          const b = [l, t, l + W, t + H];
          const covered = others.reduce((sum, o) => sum + overlapArea(b, o), 0) + overlapArea(b, labelBox(id));
          // slide a little before shrinking; shrink only when it must
          let score = bias + (1 - k) * 3000 + (ox + oy) * 6;
          if (covered > 0) score += 1e8 + covered; // text on the picture loses to anything else
          score += (Math.abs(l - l0) + Math.abs(t - t0)) * 40; // pushed off by the stage edge
          out.push({ score, x: l, y: t, w: W, h: H, side: t0 < y ? 1 : -1, group: `${k}:${sx}:${sy}` });
        });
      });
    });
  });
  return out;
}

// each skill's layout is worked out once per stage size and kept: the search takes a few hundred ms, so it runs
// ahead of time, in idle moments after the map appears, and a hover opens at once
const LAYOUTS = new Map();
const stageKey = () => `${G.kx.toFixed(4)}:${G.ky.toFixed(4)}:${Math.round(G.W)}:${Math.round(G.H)}`;
function cachedLayout(id, works) {
  const key = `${id}@${stageKey()}`;
  if (!LAYOUTS.has(key)) LAYOUTS.set(key, layoutFor(id, works));
  return LAYOUTS.get(key);
}

// the picture's corner and the projects' places are chosen together: the pair that covers least
function layoutFor(id, works) {
  let best = null;
  // the projects' places are worked out for a short list only (each try is a full search): the best place for each
  // size and corner, so the list holds different places rather than near copies of one
  const bestOf = new Map();
  cardOptions(id).forEach((c) => {
    if (!bestOf.has(c.group) || c.score < bestOf.get(c.group).score) bestOf.set(c.group, c);
  });
  [...bestOf.values()].sort((a, b) => a.score - b.score).slice(0, 8).forEach((card) => {
    const fan = fanLayout(id, works, [grow([card.x, card.y, card.x + card.w, card.y + card.h], 6), grow(verbBox(id, card.side), 4)]);
    const total = card.score + fan.score;
    if (!best || total < best.total) best = { total, card, fan };
  });
  return best;
}

// Projects fan out from the selected skill: try every direction, radius and spread and keep
// the one that covers nothing.
function fanLayout(id, works, extra = []) {
  const [ox, oy] = pos(id);
  const boxes = [...staticBoxes(), ...extra];
  // points along the links near the skill, so a project's name does not sit on a line
  const linkPts = LINKS.flatMap((l) => samplesOf(l, 24)).filter(([px, py]) => Math.hypot(px - ox, py - oy) < 640);
  let leaves = null;
  for (let deg = 0; deg < 360; deg += 5) {
    const a = (deg * Math.PI) / 180;
    [170, 200, 235, 275, 315, 360].forEach((rl) => {
      [0.22, 0.3, 0.4, 0.55].forEach((spread) => {
        const pts = works.map((p, i) => {
          const b = a + (i - (works.length - 1) / 2) * spread;
          const x = ox + rl * Math.cos(b);
          const y = oy + rl * Math.sin(b);
          const right = Math.cos(b) >= -0.2;
          const w = textWidth(`${mapTitle(p)} ↗`, 17) * 1.12 + 6;
          return { p, x, y, right, box: grow(right ? [x - 19, y - 20, x + 26 + w, y + 20] : [x - 26 - w, y - 20, x + 19, y + 20], 6) };
        });
        let score = cost(
          pts.map((o) => o.box),
          boxes
        );
        // a project's name never sits on the picture or the step tag
        pts.forEach(({ box: lb }) => {
          extra.forEach((o) => {
            score += overlapArea(lb, o) * 50;
          });
        });
        pts.forEach(({ box: lb }) => {
          linkPts.forEach(([px, py]) => {
            if (px > lb[0] && px < lb[2] && py > lb[1] && py < lb[3]) score += 1500;
          });
        });
        // nor across another skill's label
        const labels = NODES.filter((n) => n.id !== id).map((n) => labelBox(n.id));
        pts.forEach((pt) => {
          for (let k = 2; k < 10; k += 1) {
            const px = ox + ((pt.x - ox) * k) / 10;
            const py = oy + ((pt.y - oy) * k) / 10;
            if (labels.some((o) => px > o[0] && px < o[2] && py > o[1] && py < o[3])) score += 2000;
          }
        });
        // a leaf's line must not run under the card
        extra.forEach((o) => {
          pts.forEach((pt) => {
            for (let k = 1; k < 10; k += 1) {
              const px = ox + ((pt.x - ox) * k) / 10;
              const py = oy + ((pt.y - oy) * k) / 10;
              if (px > o[0] && px < o[2] && py > o[1] && py < o[3]) score += 5000;
            }
          });
        });
        if (!leaves || score < leaves.score) leaves = { score, pts };
      });
    });
  }
  return { leafPts: leaves.pts, score: leaves.score };
}

// ——— life ———
// each skill drifts on its own slow figure, a few units at most
const DRIFT = 4.5;
const PHASE = Object.fromEntries(NODES.map((n, i) => [n.id, { p1: i * 1.9, p2: i * 2.7 + 1, w1: 0.31 + (i % 4) * 0.05, w2: 0.26 + (i % 3) * 0.06 }]));
const LEAN = { reach: 190, pull: 8 }; // skills near the pointer lean in
const PULSE = { speed: 0.27, dash: 26 }; // units per ms; the dash's length
// the first screen shows work: once the map has grown in, Interaction design opens (its picture and projects)
// until the visitor picks another skill; leaving the map comes back to it
const DEFAULT_SKILL = "ixd";

const SkillMap = ({ projects }) => {
  const router = useRouter();
  // the map rests quietly: the whole network in grey with plain labels; a hovered, focused or picked skill
  // lights its own lines and neighbours, fans out its projects and opens its card
  const bandRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [soft, setSoft] = useState(false); // the open skill is the default, not the visitor's pick
  const [chipW, setChipW] = useState({});
  const labelRefs = useRef({});
  const [fit, setFit] = useState(null);
  const [frameH, setFrameH] = useState(null);
  const [sx, setSx] = useState(1);
  const [box, setBox] = useState(null);
  const sectionRef = useRef(null);
  const frameRef = useRef(null);
  const stageRef = useRef(null);
  const viewRef = useRef(null);
  const nodeEls = useRef({});
  const dotEls = useRef({});
  const edgeEls = useRef({});
  const pulseEls = useRef({});
  const fanLineEls = useRef({});
  const offs = useRef(Object.fromEntries(NODES.map((n) => [n.id, [0, 0]])));
  const pointer = useRef(null);
  const switchTimer = useRef(null);
  const motion = useMotionOn();
  const reduced = usePrefersReducedMotion();
  const animate = motion && !reduced;
  const inView = useInView(sectionRef);
  const [wide, setWide] = useState(false);
  const active = pinned;
  const activeRef = useRef(null);
  activeRef.current = active;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1152px)");
    const read = () => setWide(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);

  // `?skill=<id>` opens the map on that skill
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("skill");
    if (id && nodeOf(id)) setPinned(id);
    return () => clearTimeout(switchTimer.current);
  }, []);

  // A skill under the pointer opens at once from rest; moving from one skill to another waits a moment,
  // so crossing a skill on the way to a project does not switch the map.
  const pick = (id, now = false) => {
    clearTimeout(switchTimer.current);
    const open = () => {
      setPinned(id);
      setSoft(false);
    };
    if (now || !activeRef.current || activeRef.current === id) open();
    else switchTimer.current = setTimeout(open, 110);
  };
  const rest = () => {
    setPinned(DEFAULT_SKILL);
    setSoft(true);
  };

  // fit the graph to the first screen: its outermost ink on the page gutters, 64 px under the header,
  // 64 px to the headline, which closes the first screen 48 px above the fold
  useEffect(() => {
    const measure = () => {
      const el = frameRef.current;
      if (!el || !el.clientWidth) return; // hidden on phones: nothing to fit
      const band = bandRef.current?.offsetHeight || 0;
      const gut = gutterOf(window.innerWidth);
      const headerH = document.querySelector("header")?.offsetHeight || 65;
      const pxW = el.clientWidth - 2 * gut;
      const pxH = Math.max(320, window.innerHeight - headerH - band - 128);
      const Wu = pxW / LABEL_SCALE;
      const Hu = pxH / LABEL_SCALE;
      const widths = {};
      NODES.forEach((n) => {
        const t = labelRefs.current[n.id];
        if (t && t.getComputedTextLength) widths[n.id] = t.getComputedTextLength();
      });
      const items = itemsFor(widths);
      const fx = fitAxis(items, "x", "l", "r", Wu);
      const fy = fitAxis(items, "y", "t", "b", Hu);
      Object.assign(G, { kx: fx.k, ky: fy.k, ox: fx.offset, oy: fy.offset, W: Wu, H: Hu });
      setBox({ left: gut, top: 64, w: pxW, h: pxH });
      setSx(G.kx + G.ky / 1000);
      setFit(LABEL_SCALE);
      setFrameH(pxH + 128);
    };
    measure();
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // size each skill chip to its label once the fonts are in
  useEffect(() => {
    if (!fit) return;
    const measure = () => {
      const w = {};
      NODES.forEach((n) => {
        const el = labelRefs.current[n.id];
        if (el) w[n.id] = el.getComputedTextLength();
      });
      setChipW(w);
    };
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    else measure();
  }, [fit]);

  const workOf = (id) => nodeOf(id).work.map((pid) => projects.find((p) => p.id === pid)).filter(Boolean);
  const activeNode = active ? nodeOf(active) : null;
  const activeWork = activeNode ? workOf(active) : [];
  // the card in the clearest pocket beside the skill, then the leaves around both, their lines clear of it
  // the picture on a corner of the skill, and the projects fanned out around it and the step tag
  const layout = useMemo(() => (activeNode && fit ? cachedLayout(active, activeWork) : null), [active, sx, fit]); // eslint-disable-line react-hooks/exhaustive-deps
  // work out every skill's layout ahead of time, one per idle moment, the default skill first
  useEffect(() => {
    if (!fit || !wide) return undefined;
    const queue = [DEFAULT_SKILL, ...NODES.map((n) => n.id).filter((id) => id !== DEFAULT_SKILL)];
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 60));
    const cancel = window.cancelIdleCallback || clearTimeout;
    let handle;
    const next = () => {
      const id = queue.shift();
      if (!id) return;
      cachedLayout(id, workOf(id));
      handle = idle(next);
    };
    handle = idle(next);
    return () => cancel(handle);
  }, [fit, sx, wide]); // eslint-disable-line react-hooks/exhaustive-deps
  const card = layout ? layout.card : null;
  const fan = layout ? layout.fan : null;
  const lit = activeNode ? new Set(neighbours(active)) : new Set();
  // skills whose label the picture covers wear a chip, so they read on the picture
  const covered = new Set(card ? NODES.filter((n) => n.id !== active && overlapArea(labelBox(n.id), [card.x, card.y, card.x + card.w, card.y + card.h]) > 0).map((n) => n.id) : []);
  const [ax, ay] = active ? pos(active) : [0, 0];
  // the leaves of the skill just left fade out where they were
  const [leaving, setLeaving] = useState(null);
  const lastFan = useRef(null);
  useEffect(() => {
    const prev = lastFan.current;
    lastFan.current = fan ? { key: active, fan, ax, ay } : null;
    if (!prev || prev.key === active || !animate) return undefined;
    setLeaving(prev);
    const t = setTimeout(() => setLeaving(null), 220);
    return () => clearTimeout(t);
  }, [active, fan]); // eslint-disable-line react-hooks/exhaustive-deps

  // ——— writing the moving map: no React render per frame ———
  const writeGeometry = () => {
    const o = offs.current;
    NODES.forEach((n) => {
      const el = nodeEls.current[n.id];
      if (el) el.setAttribute("transform", `translate(${f1(o[n.id][0])} ${f1(o[n.id][1])})`);
    });
    LINKS.forEach((l) => {
      const d = curveD(l, o);
      edgeEls.current[l.key]?.setAttribute("d", d);
      pulseEls.current[l.key]?.setAttribute("d", d);
    });
    const act = activeRef.current;
    if (act) {
      const [x, y] = pos(act);
      Object.values(fanLineEls.current).forEach((el) => {
        if (!el) return;
        el.setAttribute("x1", f1(x + o[act][0]));
        el.setAttribute("y1", f1(y + o[act][1]));
      });
    }
  };

  // drift, the lean towards the pointer and the pulses: one loop, only with motion on, on a wide screen,
  // while the hero is on screen and the tab is visible
  useEffect(() => {
    if (!fit || !animate || !inView || !wide) return undefined;
    let raf;
    let last = performance.now();
    let t = 0;
    let walkers = [];
    let nextSpawn = performance.now() + 2600;
    const o = offs.current;
    const flash = (id) => dotEls.current[id]?.animate([{ transform: "scale(1)" }, { transform: "scale(1.6)" }, { transform: "scale(1)" }], { duration: 650, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
    // a pulse: a short blue dash travelling one link, from one skill to the next
    const walk = (from, link, hops, now) => {
      const el = pulseEls.current[link.key];
      if (!el) return null;
      const to = link.a === from ? link.b : link.a;
      const len = el.getTotalLength();
      return { link, from, to, len, t0: now, dur: len / PULSE.speed, hops, el };
    };
    const spawn = (now) => {
      // starts more often at the skills that carry more work
      const pool = NODES.flatMap((n) => Array(1 + weightOf(n.id)).fill(n.id));
      const from = pool[Math.floor(Math.random() * pool.length)];
      const links = INCIDENT[from];
      const w = walk(from, links[Math.floor(Math.random() * links.length)], 0, now);
      if (w) walkers.push(w);
    };
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.hidden) {
        raf = requestAnimationFrame(frame);
        return;
      }
      t += dt;
      const act = activeRef.current;
      const p = pointer.current;
      const k = Math.min(1, dt * 5);
      NODES.forEach((n) => {
        const ph = PHASE[n.id];
        let tx = 0;
        let ty = 0;
        if (n.id !== act) {
          tx = Math.sin(t * ph.w1 + ph.p1) * DRIFT;
          ty = Math.cos(t * ph.w2 + ph.p2) * DRIFT * 0.8;
          // the lean only while no skill is open: an open skill's picture keeps its neighbours' labels off it
          if (p && !act) {
            const [x, y] = pos(n.id);
            const dx = p[0] - x;
            const dy = p[1] - y;
            const d = Math.hypot(dx, dy);
            if (d > 1 && d < LEAN.reach) {
              const f = LEAN.pull * (1 - d / LEAN.reach) ** 2;
              tx += (dx / d) * f;
              ty += (dy / d) * f;
            }
          }
        }
        o[n.id][0] += (tx - o[n.id][0]) * k;
        o[n.id][1] += (ty - o[n.id][1]) * k;
      });
      writeGeometry();
      // pulses walk the links while nothing is picked: now and then one sets out, lights the skill it
      // reaches, and may carry on along another link
      if (!act && now > nextSpawn && walkers.length < 2) {
        spawn(now);
        nextSpawn = now + 2200 + Math.random() * 2600;
      }
      const next = [];
      walkers.forEach((w) => {
        const q = (now - w.t0) / w.dur;
        const D = PULSE.dash;
        if (act || q >= 1) {
          w.el.style.opacity = "0";
          if (act) return;
          flash(w.to);
          const onward = INCIDENT[w.to].filter((l) => l !== w.link);
          if (w.hops < 2 && onward.length && Math.random() < 0.7) {
            const n2 = walk(w.to, onward[Math.floor(Math.random() * onward.length)], w.hops + 1, now);
            if (n2) next.push(n2);
          }
          return;
        }
        // the path runs from link.a to link.b; a pulse going the other way runs the dash backwards
        const along = w.from === w.link.a ? q : 1 - q;
        w.el.style.opacity = "1";
        w.el.setAttribute("stroke-dasharray", `${D} ${f1(w.len + D)}`);
        w.el.setAttribute("stroke-dashoffset", f1(D - along * (w.len + D)));
        next.push(w);
      });
      walkers = next;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      walkers.forEach((w) => {
        w.el.style.opacity = "0";
      });
      // at rest: every skill back on its place
      NODES.forEach((n) => {
        o[n.id][0] = 0;
        o[n.id][1] = 0;
      });
      writeGeometry();
    };
  }, [fit, sx, animate, inView, wide]); // eslint-disable-line react-hooks/exhaustive-deps

  // ——— entrance: the map grows out of HCI ———
  useIsomorphicLayoutEffect(() => {
    if (!fit) return undefined;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!motionOn()) return;
      const s = stageRef.current;
      if (s && s.offsetParent !== null) {
        const q = (sel) => Array.from(s.querySelectorAll(sel));
        const at = (id) => 0.3 + RANK[id] * 0.075;
        q(".map-pop").forEach((el) => gsap.from(el, { scale: 0.45, opacity: 0, svgOrigin: el.dataset.o, duration: 0.55, delay: at(el.dataset.id), ease: "back.out(1.8)" }));
        q(".map-chip-g").forEach((el) => gsap.from(el, { opacity: 0, x: -6, duration: 0.5, delay: at(el.dataset.id) + 0.12, ease: "power3.out" }));
        LINKS.forEach((l) => {
          const el = edgeEls.current[l.key];
          if (!el) return;
          const len = el.getTotalLength();
          gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: Math.max(0.35, len / 1300), delay: at(l.a) + 0.15, ease: "power2.inOut", clearProps: "strokeDasharray,strokeDashoffset" });
        });
        q(".map-cluster").forEach((el) => {
          gsap.from(el, { opacity: 0, duration: 0.2, delay: at(el.dataset.head) + 0.3 });
          scramble(gsap, el, at(el.dataset.head) + 0.3);
        });
      }
    });
    // on phones the band's statement rises as before
    mm.add("(max-width: 1151px) and (prefers-reduced-motion: no-preference)", () => {
      if (!motionOn()) return;
      gsap.from(".map-narrow > *", { y: 20, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" });
    });
    return () => mm.revert();
  }, [fit !== null]);

  // once the map has grown in (about 1.6 s with motion, at once without), the default skill opens, unless
  // the visitor or a `?skill=` link has opened one already
  useEffect(() => {
    if (!fit || !wide) return undefined;
    const t = setTimeout(() => {
      if (!activeRef.current) rest();
    }, animate ? 1700 : 0);
    return () => clearTimeout(t);
  }, [fit !== null, wide]); // eslint-disable-line react-hooks/exhaustive-deps

  // scroll: no hold. As the hero leaves, the map lingers a little behind the page, leans in toward the skills
  // behind the first project in Selected work, and fades back so the list arrives on a quiet page.
  useIsomorphicLayoutEffect(() => {
    if (!fit) return undefined;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1152px) and (prefers-reduced-motion: no-preference)", () => {
      if (!motion) return undefined;
      const view = viewRef.current;
      if (!view) return undefined;
      const lead = [...projects].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))[0];
      const focus = lead ? NODES.filter((n) => n.work.includes(lead.id)) : [];
      // the focus skills' centre, in the frame's pixels (the stage inside it is scaled to fit)
      const origin = () => {
        if (!focus.length) return "50% 50%";
        const k = view.offsetWidth / G.W;
        const [x, y] = focus.map((n) => pos(n.id)).reduce(([a, b], [c, d]) => [a + c / focus.length, b + d / focus.length], [0, 0]);
        return `${x * k}px ${y * k}px`;
      };
      const headerH = () => document.querySelector("header")?.offsetHeight || 65;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: "#map",
          start: () => `top ${headerH()}px`,
          end: "bottom top",
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });
      tl.fromTo(view, { scale: 1 }, { scale: 1.08, transformOrigin: origin, duration: 1 }, 0);
      tl.fromTo(view, { opacity: 1 }, { opacity: 0.15, duration: 0.6 }, 0);
      // the motion switch finishes running tweens where they end: put the map back at rest
      return () => gsap.set(view, { clearProps: "transform,transformOrigin,opacity" });
    });
    return () => mm.revert();
  }, [fit !== null, motion]);

  // new skill: its projects grow out of it and their lines draw in
  useIsomorphicLayoutEffect(() => {
    if (!fit || !active) return undefined;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!motionOn()) return;
      const s = stageRef.current;
      if (!s) return;
      const [x, y] = pos(active);
      const leaves = Array.from(s.querySelectorAll(".fan-item:not(.fan-leaving) .fan-leaf"));
      if (!leaves.length) return;
      gsap.from(leaves, {
        x: (i, el) => (x - Number(el.dataset.x)) * 0.7,
        y: (i, el) => (y - Number(el.dataset.y)) * 0.7,
        scale: 0.5,
        opacity: 0,
        duration: 0.55,
        stagger: 0.05,
        ease: "expo.out",
      });
      drawIn(gsap, Array.from(s.querySelectorAll(".fan-item:not(.fan-leaving) .fan-line")), { duration: 0.4, ease: "power3.out" });
    });
    return () => mm.revert();
  }, [active, fit]);

  const toggle = (id) => {
    setSoft(false);
    setPinned((current) => (current === id ? null : id));
  };
  const statement = STATEMENT.map((part, i) => {
    if (typeof part === "string") return <React.Fragment key={i}>{part}</React.Fragment>;
    const [text, id] = part;
    return (
      /* a span, not a <button>: buttons cannot wrap mid-phrase, and the sentence must read as one */
      <span
        key={id}
        role="button"
        tabIndex={0}
        aria-pressed={active === id}
        aria-label={`${text}: show ${labelOf(id)} in the map`}
        onMouseEnter={() => pick(id, true)}
        onFocus={() => pick(id, true)}
        onClick={() => pick(id, true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pick(id, true);
          }
        }}
        className={`cursor-pointer underline decoration-2 underline-offset-[6px] transition-[text-decoration-color,color] duration-150 hover:text-olive ${active === id ? "text-olive decoration-olive" : "decoration-ink/25"}`}
      >
        {text}
      </span>
    );
  });
  const skillLabel = (id) => `${labelOf(id)}: ${nodeOf(id).tools.join(", ")}; used in ${workOf(id).length} projects`;
  const nodeProps = (label, onSelect) => ({
    tabIndex: 0,
    role: "button",
    "aria-label": label,
    onClick: onSelect,
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect();
      }
    },
    style: { cursor: "pointer" },
    className: "map-focus",
  });
  const goTo = (id) => router.push(`/projects/${id}`);
  const leaf = (fanSet, x0, y0, exiting) =>
    fanSet.leafPts.map(({ p, x, y, right }) => (
      <g
        key={`w-${p.id}`}
        {...(exiting ? { "aria-hidden": "true" } : nodeProps(`Open ${mapTitle(p)}`, () => goTo(p.id)))}
        // after the spread, so the leaf keeps both its focus class and its own
        className={`map-focus fan-item ${exiting ? "fan-leaving" : ""}`}
        role={exiting ? undefined : "link"}
      >
        <line
          ref={
            exiting
              ? undefined
              : (el) => {
                  fanLineEls.current[p.id] = el;
                }
          }
          className="fan-line"
          x1={x0}
          y1={y0}
          x2={x}
          y2={y}
          style={{ stroke: "rgb(var(--olive))" }}
          strokeWidth="1.5"
        />
        <g className="fan-leaf" data-x={x} data-y={y}>
          <circle cx={x} cy={y} r="6" style={{ fill: "rgb(var(--olive))" }} />
          <text x={right ? x + 14 : x - 14} y={y + 5} textAnchor={right ? "start" : "end"} fontFamily="Inter Tight, sans-serif" fontSize="17" fontWeight="600" className="underline-offset-2 hover:underline" style={{ fill: "rgb(var(--ink))", ...HALO }}>
            {mapTitle(p)} ↗
          </text>
        </g>
      </g>
    ));

  return (
    <section
      ref={sectionRef}
      id="map"
      aria-labelledby="map-title"
      className="relative scroll-mt-16 bg-bone"
      onKeyDown={(e) => {
        const i = "12345".indexOf(e.key);
        if (i < 0 || !plainKey(e)) return;
        const c = CLUSTERS.find((x) => x.id === STEP_KEYS[i]);
        if (c) pick(c.skills[0], true);
      }}
    >
      <style>{`
        .map-node { transform-box: fill-box; transform-origin: center; }
        .fan-leaving { animation: map-fan-out 200ms ease-out forwards; pointer-events: none; }
        @keyframes map-fan-out { to { opacity: 0; } }
      `}</style>
      <h2 id="map-title" className="sr-only">
        Skill map
      </h2>
      {/* ——— desktop and tablet: the fixed stage ——— */}
      <div ref={frameRef} className="relative hidden h-[calc(100svh-64px)] w-full map:block" style={frameH ? { height: frameH } : undefined}>
        <div ref={viewRef} className="absolute" style={box ? { left: box.left, top: box.top, width: box.w, height: box.h, visibility: fit ? "visible" : "hidden" } : { visibility: "hidden" }}>
          <div
            ref={stageRef}
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: G.W, height: G.H, transform: `scale(${fit || 1})` }}
            onPointerMove={(e) => {
              const r = stageRef.current.getBoundingClientRect();
              const k = r.width / G.W;
              pointer.current = [(e.clientX - r.left) / k, (e.clientY - r.top) / k];
            }}
            onMouseLeave={() => {
              pointer.current = null;
              clearTimeout(switchTimer.current);
              rest();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setPinned(null);
                setSoft(false);
              }
            }}
          >
            {fit && <SkillScreen skill={active} box={card} animate={animate && wide} />}
            <svg viewBox={`0 0 ${G.W} ${G.H}`} className="absolute inset-0 z-[1] h-full w-full overflow-visible" role="group" aria-label="Skills, linked where they feed into each other; larger points carry more projects. Select one to see its projects and a picture of its work.">
              {/* the links stop at the picture's edge */}
              {card && (
                <defs>
                  <mask id="map-picture-cut" maskUnits="userSpaceOnUse" x={-400} y={-400} width={G.W + 800} height={G.H + 800}>
                    <rect x={-400} y={-400} width={G.W + 800} height={G.H + 800} fill="#fff" />
                    <rect x={card.x} y={card.y} width={card.w} height={card.h} fill="#000" />
                  </mask>
                </defs>
              )}
              <g aria-hidden="true" fill="none" mask={card ? "url(#map-picture-cut)" : undefined}>
                {LINKS.map((l) => {
                  const hot = active && (l.a === active || l.b === active);
                  const d = curveD(l);
                  return (
                    <g key={l.key}>
                      <path
                        ref={(el) => {
                          edgeEls.current[l.key] = el;
                        }}
                        className="map-edge"
                        d={d}
                        style={{ stroke: hot ? "rgb(var(--olive))" : "rgb(var(--ink))", transition: "stroke .3s, stroke-width .3s, opacity .3s" }}
                        strokeWidth={hot ? 4 : 1.25}
                        opacity={hot ? 1 : active ? 0.25 : 0.55}
                        strokeLinecap="round"
                      />
                      <path
                        ref={(el) => {
                          pulseEls.current[l.key] = el;
                        }}
                        d={d}
                        style={{ stroke: "rgb(var(--olive))", opacity: 0 }}
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </g>
                  );
                })}
              </g>

              {leaving && <g aria-hidden="true">{leaf(leaving.fan, leaving.ax, leaving.ay, true)}</g>}
              {fan && <g key={active}>{leaf(fan, ax, ay, false)}</g>}

              {NODES.map((n) => {
                const [x, y] = pos(n.id);
                const dy = MAP.label[n.id][1];
                const dx = labelDx(n.id);
                const r = nodeR(n.id);
                const isActive = active === n.id;
                const isLit = lit.has(n.id);
                const plain = !isActive && !isLit && hovered !== n.id && !covered.has(n.id);
                // the open skill wears its step as a tag; no other skill shows one
                const c = isActive && card ? clusterOf(n.id) : null;
                return (
                  <g
                    key={n.id}
                    data-skill={n.id}
                    {...nodeProps(skillLabel(n.id), () => toggle(n.id))}
                    aria-pressed={pinned === n.id}
                    onMouseEnter={() => {
                      setHovered(n.id);
                      pick(n.id);
                    }}
                    onMouseLeave={() => {
                      setHovered(null);
                      clearTimeout(switchTimer.current);
                    }}
                    onFocus={() => {
                      setHovered(n.id);
                      pick(n.id, true);
                    }}
                    onBlur={() => setHovered(null)}
                  >
                    {/* the skill drifts as one piece: point, label and, for a step's first skill, its verb */}
                    <g
                      ref={(el) => {
                        nodeEls.current[n.id] = el;
                      }}
                    >
                      <circle cx={x} cy={y} r="24" fill="transparent" />
                      {c && (
                        <g aria-hidden="true">
                          {(() => {
                            const [vx, vy] = verbAt(n.id, card.side);
                            return (
                              <>
                                {/* the open skill's step: a blue tag, the one filled label in the map */}
                                <rect x={vx - 7} y={vy - 16} width={verbW(c) + 14} height="22" style={{ fill: "rgb(var(--olive-fill))" }} />
                                <text className="map-cluster" data-head={n.id} x={vx} y={vy} fontFamily="JetBrains Mono, monospace" fontSize={VERB_SIZE} fontWeight="700" letterSpacing="0.16em" style={{ fill: "#fff" }}>
                                  {c.label.toUpperCase()}
                                </text>
                              </>
                            );
                          })()}
                        </g>
                      )}
                      <g className="map-pop" data-id={n.id} data-o={`${f1(x)} ${f1(y)}`}>
                        {/* the selected skill: a crisp ink ring around the point, no glow */}
                        {isActive && <circle className="map-ring" cx={x} cy={y} r={r + 9} fill="none" style={{ stroke: "rgb(var(--ink))" }} strokeWidth="1.5" />}
                        <circle
                          ref={(el) => {
                            dotEls.current[n.id] = el;
                          }}
                          className="map-node"
                          cx={x}
                          cy={y}
                          r={isActive ? r + 3 : r}
                          style={{
                            fill: isActive ? "rgb(var(--olive))" : isLit ? "rgb(var(--ink))" : "rgb(var(--bone))",
                            stroke: isActive ? "rgb(var(--olive))" : "rgb(var(--ink))",
                            transition: "fill .25s, stroke .25s, r .25s",
                          }}
                          strokeWidth="2"
                        />
                      </g>
                      <g className="map-chip-g" data-id={n.id}>
                        {/* quiet: only the selected skill and its neighbours wear a chip; the rest read as plain labels */}
                        {!plain &&
                          (() => {
                            const tw = (chipW[n.id] || textWidth(n.label, 18)) * (isActive || isLit ? 1.05 : 1);
                            const left = x + dx;
                            return (
                              <rect
                                className="map-chip"
                                x={left - 10}
                                y={y + dy - 18}
                                width={tw + 20}
                                height="25"
                                style={{
                                  fill: isActive ? "rgb(var(--olive-fill))" : hovered === n.id ? "color-mix(in srgb, rgb(var(--olive)) 16%, rgb(var(--chalk)))" : "rgb(var(--paper))",
                                  stroke: isActive || hovered === n.id ? "rgb(var(--olive))" : isLit ? "rgb(var(--ink))" : "rgb(var(--concrete))",
                                  transition: "fill .2s, stroke .2s",
                                }}
                                strokeWidth={hovered === n.id && !isActive ? 2.5 : isLit ? 1.5 : 1}
                              />
                            );
                          })()}
                        <text
                          ref={(el) => {
                            labelRefs.current[n.id] = el;
                          }}
                          className="map-label"
                          x={x + dx}
                          y={y + dy}
                          fontFamily="Inter Tight, sans-serif"
                          fontSize="18"
                          fontWeight={isActive ? 700 : isLit ? 600 : 500}
                          style={{
                            fill: isActive ? "#fff" : hovered === n.id ? "rgb(var(--olive))" : "rgb(var(--ink))",
                            transition: "fill .2s",
                            // a plain label (no chip) keeps the lines off its letters with a halo in the page colour
                            ...(plain ? HALO : {}),
                          }}
                        >
                          {n.label}
                        </text>
                      </g>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* the screen is a picture behind the skill; screen readers hear the skill */}
            <p className="sr-only" aria-live="polite">
              {activeNode && !soft ? `${activeNode.label}. ${SKILL_NOTES[active]} Tools: ${activeNode.tools.join(", ")}.` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* the statement closes the first screen, just above the fold */}
      <div ref={bandRef} className="map-intro fu-gutter hidden grid-cols-12 items-end gap-x-8 pb-12 map:grid">
        <p className="fu-display col-span-9 leading-[1.06]" style={{ fontSize: "clamp(32px, 5vh, 48px)" }}>
          {statement}
        </p>
      </div>
      {/* ——— phones and tablets: the statement only; the map needs a wide screen ——— */}
      <div className="relative overflow-hidden px-4 pb-8 pt-12 fu-gutter tablet:pb-24 tablet:pt-20 map:hidden">
        <div className="map-narrow relative flex flex-col gap-6 tablet:gap-8">
          {/* the same heavy display line as on wide screens */}
          <p className="fu-display max-w-[900px] text-[38px] tablet:text-[60px]">{STATEMENT_TEXT}</p>
          {/* tablets: the three projects that lead Selected work, across the full width; on phones Selected work
              follows straight after the statement, so the cards would only repeat it */}
          <ul className="hidden grid-cols-3 gap-4 tablet:grid">
            {[...projects]
              .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
              .slice(0, 3)
              .map((w) => (
                <li key={w.id}>
                  <Link href={`/projects/${w.id}`} className="flex flex-col gap-1.5 text-[14px] font-semibold leading-tight">
                    <img src={withBase(w.homeCard || w.cardWebp || w.cardImage)} alt="" className="aspect-[4/3] w-full border border-ink object-cover" loading="eager" draggable={false} />
                    <span>{mapTitle(w)}</span>
                  </Link>
                </li>
              ))}
          </ul>
          <a href="#work" className="hidden min-h-[44px] w-max items-center border-b-2 border-olive font-mono text-[14px] text-olive tablet:inline-flex">
            All work
          </a>
        </div>
      </div>
    </section>
  );
};

export default SkillMap;
