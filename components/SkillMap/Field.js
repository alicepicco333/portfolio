// ?hero=field: the practice as a living network on a field of points. Each skill is a well in the field,
// as deep as the number of projects it carries, so the HCI side visibly pulls the most. A small spring
// system settles the network into an even layout on load, lets it drift a little, and leans it towards
// the pointer. Picking a skill grows its projects out of it as leaves that join the network, which makes
// room for them.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { gsap } from "gsap";
import { EDGES, NODES, neighbours, labelOf, nodeOf } from "../Graph/data";
import {
  weightOf,
  measure,
  mapTitle,
  useFontsReady,
  useSize,
  useAnimate,
  canAnimate,
  useInView,
  useSkillState,
  heroKeys,
  Statement,
  SkillCard,
  PhoneHero,
  AVAILABLE,
  liveLine,
  skillAria,
  STEPS,
} from "./shared";

const LABEL = 16;
const LEAF = 15;
// reading order, for Tab and the arrow keys: step by step, the skills with more projects first
const IDS = STEPS.flatMap((s) => [...s.skills].sort((a, b) => weightOf(b) - weightOf(a)));
// The resting layout, drawn to have no crossings: the cycle of seven around the edge (ethnography, user
// research, HCI, UX design, visual design, data visualization, digital archives), the HCI path (HCI,
// interaction design, live coding, data) through the middle, ontologies outside archives. The HCI side
// takes the top row and the centre. Stretched to the frame; the physics only ever returns to it.
const SEED = {
  ur: [0.2, 0.08],
  hci: [0.47, 0],
  ux: [0.75, 0.1],
  anth: [0.02, 0.46],
  ixd: [0.43, 0.44],
  spec: [0.64, 0.3],
  vis: [0.93, 0.5],
  live: [0.6, 0.74],
  onto: [0, 1],
  arch: [0.24, 0.86],
  dv: [0.8, 0.96],
};
// a skill added to the data later still gets a place, in the open middle of the frame
NODES.forEach((n, i) => {
  if (!SEED[n.id]) SEED[n.id] = [0.3 + ((i * 0.17) % 0.4), 0.6];
});
const gutterOf = (vw) => Math.max(32, (vw - 1600) / 2 + 32);
const dotR = (id) => 4 + 2 * weightOf(id);

// ——— the spring system ———
const rectOf = (b) => {
  const h = b.kind === "leaf" ? 12 : 13;
  return b.side === "r" ? [b.x - b.r - 6, b.y - h, b.x + b.r + 13 + b.lw, b.y + h] : [b.x - b.r - 13 - b.lw, b.y - h, b.x + b.r + 6, b.y + h];
};

function makeSim(W, H, area, widths) {
  const bodies = {};
  IDS.forEach((id, i) => {
    bodies[id] = { id, kind: "skill", x: 0, y: 0, vx: 0, vy: 0, m: 1 + 0.35 * weightOf(id), r: dotR(id), lw: widths[id], side: "r", ph: i * 1.7, w1: 0.21 + (i % 4) * 0.045, w2: 0.17 + (i % 3) * 0.05 };
  });
  const S = { W, H, area, bodies, leaves: [], links: EDGES.map(([a, b]) => [bodies[a], bodies[b], 160]), leafL: 112, k: 0.014, C: 2400, damp: 0.84, t: 0, fieldIn: 1 };
  return S;
}
// the push every pair of bodies gives each other
function repel(B, C, cb) {
  for (let i = 0; i < B.length; i += 1) {
    for (let j = i + 1; j < B.length; j += 1) {
      const a = B[i];
      const c = B[j];
      const dx = c.x - a.x;
      const dy = c.y - a.y;
      const d2 = Math.max(dx * dx + dy * dy, 900);
      const d = Math.sqrt(d2);
      const f = C / d2;
      cb(a, c, (f * dx) / d, (f * dy) / d);
    }
  }
}
const listOf = (S) => [...IDS.map((id) => S.bodies[id]), ...S.leaves];

function step(S, o = {}) {
  const B = listOf(S);
  B.forEach((b) => {
    b.ax = 0;
    b.ay = 0;
  });
  const pull = (a, c, L, k) => {
    const dx = c.x - a.x;
    const dy = c.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const f = k * (d - L);
    a.ax += (f * dx) / d / a.m;
    a.ay += (f * dy) / d / a.m;
    c.ax -= (f * dx) / d / c.m;
    c.ay -= (f * dy) / d / c.m;
  };
  // unfolding: only the pull home, so the network opens out in one piece
  if (!o.unfold) {
    S.links.forEach(([a, c, L]) => pull(a, c, L, S.k));
    S.leaves.forEach((l) => pull(S.bodies[l.parent], l, S.leafL, 0.03));
    repel(B, S.C, (a, c, fx, fy) => {
      a.ax -= fx / a.m;
      a.ay -= fy / a.m;
      c.ax += fx / c.m;
      c.ay += fy / c.m;
    });
  }
  B.forEach((b) => {
    if (b.kind === "skill") {
      // the resting layout is an equilibrium: the push it already has at rest is taken off
      if (b.bx !== undefined && !o.unfold) {
        b.ax -= b.bx;
        b.ay -= b.by;
      }
      // each skill keeps to its place, give or take a slow drift
      if (o.home) {
        const ox = o.drift ? Math.sin(S.t * b.w1 + b.ph) * 9 : 0;
        const oy = o.drift ? Math.cos(S.t * b.w2 + b.ph * 1.3) * 6 : 0;
        b.ax += (b.hx + ox - b.x) * o.home;
        b.ay += (b.hy + oy - b.y) * o.home;
      }
      // the pointer: skills close to it lean in
      if (o.pointer && b.id !== o.active) {
        const dx = o.pointer[0] - b.x;
        const dy = o.pointer[1] - b.y;
        const d = Math.hypot(dx, dy);
        if (d < 220 && d > 1) {
          const f = 0.32 * (1 - d / 220);
          b.ax += (f * dx) / d;
          b.ay += (f * dy) / d;
        }
      }
    }
  });
  B.forEach((b) => {
    if (b.fixed) {
      b.vx = 0;
      b.vy = 0;
      return;
    }
    b.vx = (b.vx + b.ax) * S.damp;
    b.vy = (b.vy + b.ay) * S.damp;
    b.x += b.vx;
    b.y += b.vy;
  });
  if (!o.unfold) collide(S, B, o.obstacle);
}

// labels never overlap: overlapping boxes are pushed apart along their shorter overlap
function collide(S, B, obstacle) {
  const [x0, y0, x1, y1] = S.area;
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < B.length; i += 1) {
      for (let j = i + 1; j < B.length; j += 1) {
        const a = B[i];
        const c = B[j];
        const A = rectOf(a);
        const C = rectOf(c);
        const ox = Math.min(A[2], C[2]) - Math.max(A[0], C[0]) + 8;
        const oy = Math.min(A[3], C[3]) - Math.max(A[1], C[1]) + 8;
        if (ox > 0 && oy > 0) {
          const wa = a.fixed ? 0 : c.fixed ? 1 : c.m / (a.m + c.m);
          const wc = 1 - wa;
          if (ox < oy * 1.4) {
            const s = A[0] + A[2] < C[0] + C[2] ? 1 : -1;
            a.x -= s * ox * wa * 0.5;
            c.x += s * ox * wc * 0.5;
          } else {
            const s = A[1] + A[3] < C[1] + C[3] ? 1 : -1;
            a.y -= s * oy * wa * 0.5;
            c.y += s * oy * wc * 0.5;
          }
        }
      }
    }
  }
  B.forEach((b) => {
    if (b.fixed) return;
    if (obstacle) {
      const R = rectOf(b);
      const [ox0, oy0, ox1, oy1] = obstacle;
      if (Math.min(R[2], ox1) > Math.max(R[0], ox0) && Math.min(R[3], oy1) > Math.max(R[1], oy0)) {
        // the shortest way out of the card that stays inside the frame
        const ways = [
          [-(R[2] - ox0), 0],
          [ox1 - R[0], 0],
          [0, -(R[3] - oy0)],
          [0, oy1 - R[1]],
        ].filter(([dx, dy]) => R[0] + dx >= x0 && R[2] + dx <= x1 && R[1] + dy >= y0 && R[3] + dy <= y1);
        ways.sort((p, q) => Math.abs(p[0] + p[1]) - Math.abs(q[0] + q[1]));
        if (ways.length) {
          b.x += ways[0][0] * 0.25;
          b.y += ways[0][1] * 0.25;
        }
      }
    }
    const R = rectOf(b);
    if (R[0] < x0) b.x += x0 - R[0];
    if (R[2] > x1) b.x -= R[2] - x1;
    if (R[1] < y0) b.y += y0 - R[1];
    if (R[3] > y1) b.y -= R[3] - y1;
  });
}

// the resting layout: the planar seed, stretched so the outermost ink meets the frame
function settle(S) {
  const [x0, y0, x1, y1] = S.area;
  IDS.forEach((id) => {
    const b = S.bodies[id];
    b.x = x0 + SEED[id][0] * (x1 - x0);
    b.y = y0 + SEED[id][1] * (y1 - y0);
    b.vx = 0;
    b.vy = 0;
    // labels on the side with room: the right, except in the right-hand fifth
    b.side = SEED[id][0] > 0.8 ? "l" : "r";
  });
  const cxA = (x0 + x1) / 2;
  const cyA = (y0 + y1) / 2;
  const span = (k, axis) => {
    let lo = Infinity;
    let hi = -Infinity;
    IDS.forEach((id) => {
      const b = S.bodies[id];
      const c = axis === "x" ? b.x : b.y;
      const p = { ...b, [axis]: (axis === "x" ? cxA : cyA) + (c - (axis === "x" ? S.bx : S.by)) * k };
      const R = rectOf(p);
      lo = Math.min(lo, axis === "x" ? R[0] : R[1]);
      hi = Math.max(hi, axis === "x" ? R[2] : R[3]);
    });
    return [lo, hi];
  };
  S.bx = IDS.reduce((a, id) => a + S.bodies[id].x, 0) / IDS.length;
  S.by = IDS.reduce((a, id) => a + S.bodies[id].y, 0) / IDS.length;
  ["x", "y"].forEach((axis) => {
    const size = axis === "x" ? x1 - x0 : y1 - y0;
    let lo = 0.2;
    let hi = 4;
    for (let i = 0; i < 40; i += 1) {
      const m = (lo + hi) / 2;
      const [a, b] = span(m, axis);
      if (b - a > size) hi = m;
      else lo = m;
    }
    const [a, b] = span(lo, axis);
    const shift = (axis === "x" ? x0 : y0) - a + (size - (b - a)) / 2;
    IDS.forEach((id) => {
      const bd = S.bodies[id];
      if (axis === "x") bd.x = cxA + (bd.x - S.bx) * lo + shift;
      else bd.y = cyA + (bd.y - S.by) * lo + shift;
    });
  });
  for (let i = 0; i < 4; i += 1) collide(S, listOf(S));
  IDS.forEach((id) => {
    const b = S.bodies[id];
    b.hx = b.x;
    b.hy = b.y;
    b.bx = 0;
    b.by = 0;
  });
  // springs rest at the lengths they have here, and the push at rest is recorded, so this is an equilibrium
  S.links.forEach((l) => {
    l[2] = Math.hypot(l[1].x - l[0].x, l[1].y - l[0].y);
  });
  const B = IDS.map((id) => S.bodies[id]);
  repel(B, S.C, (a, c, fx, fy) => {
    a.bx -= fx / a.m;
    a.by -= fy / a.m;
    c.bx += fx / c.m;
    c.by += fy / c.m;
  });
  // the lines bow away from the middle of the network
  S.mx = IDS.reduce((a, id) => a + S.bodies[id].hx, 0) / IDS.length;
  S.my = IDS.reduce((a, id) => a + S.bodies[id].hy, 0) / IDS.length;
}

const f1 = (v) => Math.round(v * 10) / 10;
function curve(S, a, c, bend = 0.1) {
  const mx = (a.x + c.x) / 2;
  const my = (a.y + c.y) / 2;
  const dx = c.x - a.x;
  const dy = c.y - a.y;
  let nx = -dy;
  let ny = dx;
  if ((mx - S.mx) * nx + (my - S.my) * ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  return `M${f1(a.x)} ${f1(a.y)}Q${f1(mx + nx * bend)} ${f1(my + ny * bend)} ${f1(c.x)} ${f1(c.y)}`;
}

// ——— the field ———
function drawField(cv, S, o) {
  const ctx = cv.getContext("2d");
  const { W, H } = S;
  const dpr = cv.width / W;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = o.color;
  const wells = IDS.map((id) => {
    const b = S.bodies[id];
    const w = weightOf(id);
    return { x: b.x, y: b.y, s: 3 + 3 * w, g: 56 + 16 * w, k: 0.12 + 0.08 * w };
  });
  if (o.active) {
    const b = S.bodies[o.active];
    wells.push({ x: b.x, y: b.y, s: 6, g: 120, k: 0.3 });
  }
  if (o.pointer) wells.push({ x: o.pointer[0], y: o.pointer[1], s: 11, g: 95, k: 0.32 });
  const sp = 22;
  const off = (W % sp) / 2;
  for (let gy = sp / 2; gy < H; gy += sp) {
    // the field thins out towards the top and the statement below
    const edge = Math.min(1, gy / 60, (H - gy) / 90);
    if (edge <= 0) continue;
    for (let gx = off; gx < W; gx += sp) {
      let dx = 0;
      let dy = 0;
      let k = 0;
      for (let i = 0; i < wells.length; i += 1) {
        const w = wells[i];
        const ex = w.x - gx;
        const ey = w.y - gy;
        const d2 = ex * ex + ey * ey;
        if (d2 > 9 * w.g * w.g) continue;
        const e = Math.exp(-d2 / (2 * w.g * w.g));
        dx += (ex / w.g) * w.s * e;
        dy += (ey / w.g) * w.s * e;
        k += e * w.k;
      }
      ctx.globalAlpha = Math.min(0.62, 0.14 + k) * edge * S.fieldIn;
      const s = 1.5 + Math.min(1.2, k * 2.2);
      ctx.fillRect(gx + dx - s / 2, gy + dy - s / 2, s, s);
    }
  }
  ctx.globalAlpha = 1;
}

const Field = ({ projects }) => {
  const router = useRouter();
  const state = useSkillState();
  const { active } = state;
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const cardRef = useRef(null);
  const nodeEls = useRef({});
  const edgeEls = useRef({});
  const leafEls = useRef({});
  const size = useSize(stageRef);
  const fonts = useFontsReady();
  const animate = useAnimate();
  const inView = useInView(sectionRef);
  const simRef = useRef(null);
  const pointer = useRef(null);
  const colorRef = useRef("rgb(14,14,16)");
  const activeRef = useRef(null);
  activeRef.current = active;
  const [ready, setReady] = useState(false);

  const work = useMemo(() => {
    if (!active) return [];
    return nodeOf(active)
      .work.map((pid) => projects.find((p) => p.id === pid))
      .filter(Boolean);
  }, [active, projects]);

  // the ink colour for the canvas, kept in step with the theme and contrast settings
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim().split(/\s+/).join(",");
      colorRef.current = `rgb(${v})`;
      if (simRef.current && canvasRef.current) draw();
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-contrast"] });
    return () => mo.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // write the simulation into the drawing: no React render per frame
  const draw = () => {
    const S = simRef.current;
    if (!S) return;
    IDS.forEach((id) => {
      const b = S.bodies[id];
      const el = nodeEls.current[id];
      if (el) el.setAttribute("transform", `translate(${f1(b.x)},${f1(b.y)})`);
    });
    EDGES.forEach(([a, c]) => {
      const el = edgeEls.current[`${a}-${c}`];
      if (el) {
        const d = curve(S, S.bodies[a], S.bodies[c]);
        el.forEach((p) => p && p.setAttribute("d", d));
      }
    });
    S.leaves.forEach((l) => {
      const els = leafEls.current[l.id];
      if (!els) return;
      const p = S.bodies[l.parent];
      // the label sits on the side away from its skill
      if (l.x > p.x + 14) l.side = "r";
      else if (l.x < p.x - 14) l.side = "l";
      if (els.g) {
        els.g.setAttribute("transform", `translate(${f1(l.x)},${f1(l.y)})`);
        if (els.t) {
          els.t.setAttribute("x", l.side === "r" ? 12 : -12);
          els.t.setAttribute("text-anchor", l.side === "r" ? "start" : "end");
        }
      }
      if (els.line) els.line.setAttribute("d", `M${f1(p.x)} ${f1(p.y)}L${f1(l.x)} ${f1(l.y)}`);
    });
    if (canvasRef.current) drawField(canvasRef.current, S, { color: colorRef.current, pointer: pointer.current, active: activeRef.current });
  };

  // build and settle the network for this stage size
  useEffect(() => {
    if (!fonts || !size || size.w < 400) return;
    const gut = gutterOf(window.innerWidth);
    const area = [gut, 44, size.w - gut, size.h - 40];
    const widths = Object.fromEntries(IDS.map((id) => [id, measure(labelOf(id), LABEL)]));
    const S = makeSim(size.w, size.h, area, widths);
    settle(S);
    const first = !simRef.current;
    const old = simRef.current;
    simRef.current = S;
    const cv = canvasRef.current;
    if (cv) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(size.w * dpr);
      cv.height = Math.round(size.h * dpr);
    }
    if (first && canAnimate()) {
      // entrance: the network unfolds from a small copy of itself in the middle and settles where it belongs
      IDS.forEach((id) => {
        const b = S.bodies[id];
        b.x = S.mx + (b.hx - S.mx) * 0.12;
        b.y = S.my + (b.hy - S.my) * 0.12;
      });
      S.fieldIn = 0;
      S.entering = performance.now();
    } else if (old) {
      S.t = old.t;
    }
    setReady(true);
    draw();
  }, [size, fonts]); // eslint-disable-line react-hooks/exhaustive-deps
  // the labels and the statement arrive while the network unfolds
  const ctxRef = useRef(null);
  useEffect(() => {
    if (!ready || !simRef.current?.entering || ctxRef.current) return;
    ctxRef.current = gsap.context(() => {
      gsap.from(".fld-label", { opacity: 0, duration: 0.6, delay: 0.45, stagger: 0.03, ease: "power2.out" });
      gsap.from(".fld-band > *", { opacity: 0, y: 14, duration: 0.7, stagger: 0.08, delay: 0.2, ease: "power3.out" });
    }, sectionRef);
  }, [ready]);
  useEffect(() => () => ctxRef.current?.revert(), []);

  // a picked skill grows its projects as leaves; other skills make room
  useEffect(() => {
    const S = simRef.current;
    if (!S) return;
    IDS.forEach((id) => {
      S.bodies[id].fixed = false;
    });
    if (!active) {
      S.leaves = [];
      if (!animate) {
        IDS.forEach((id) => {
          const b = S.bodies[id];
          b.x = b.hx;
          b.y = b.hy;
        });
      }
      draw();
      return;
    }
    const p = S.bodies[active];
    const out = Math.atan2(p.y - S.my, p.x - S.mx); // away from the middle of the network
    S.leaves = work.map((w, i) => {
      const a = out + (i - (work.length - 1) / 2) * 0.75;
      return {
        id: w.id,
        kind: "leaf",
        parent: active,
        x: p.x + Math.cos(a) * (animate ? 8 : S.leafL),
        y: p.y + Math.sin(a) * (animate ? 8 : S.leafL),
        vx: Math.cos(a) * (animate ? 6 : 0),
        vy: Math.sin(a) * (animate ? 6 : 0),
        m: 0.6,
        r: 5,
        lw: measure(`${mapTitle(w)} ↗`, LEAF, { weight: 600 }),
        side: Math.cos(a) >= 0 ? "r" : "l",
      };
    });
    if (!animate) {
      // no motion: the network makes room for the leaves and the card at once, without moving on screen
      const card = cardRef.current;
      const obstacle = card ? [card.offsetLeft - 28, card.offsetTop - 16, card.offsetLeft + card.offsetWidth + 28, card.offsetTop + card.offsetHeight + 16] : null;
      IDS.forEach((id) => {
        const b = S.bodies[id];
        b.x = b.hx;
        b.y = b.hy;
        b.vx = 0;
        b.vy = 0;
      });
      for (let i = 0; i < 320; i += 1) step(S, { home: 0.012, obstacle });
    }
    // draw once React has the leaves in the DOM
    requestAnimationFrame(draw);
  }, [active, work, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // with motion off the layout returns to its settled place whenever motion stops
  useEffect(() => {
    const S = simRef.current;
    if (!S || animate) return;
    IDS.forEach((id) => {
      const b = S.bodies[id];
      if (b.hx !== undefined) {
        b.x = b.hx;
        b.y = b.hy;
      }
    });
    S.fieldIn = 1;
    draw();
  }, [animate, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // the loop: on screen, motion on
  useEffect(() => {
    if (!ready || !animate || !inView) return undefined;
    let raf;
    let last = performance.now();
    let acc = 0;
    const frame = (now) => {
      const S = simRef.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (S && !document.hidden) {
        acc += dt;
        let n = 0;
        // the card is an obstacle while it is open (read once a frame, before anything is written)
        const card = activeRef.current && cardRef.current ? cardRef.current : null;
        const obstacle = card ? [card.offsetLeft - 28, card.offsetTop - 16, card.offsetLeft + card.offsetWidth + 28, card.offsetTop + card.offsetHeight + 16] : null;
        while (acc >= 1 / 60 && n < 3) {
          acc -= 1 / 60;
          n += 1;
          S.t += 1 / 60;
          const entering = S.entering && now - S.entering < 1400;
          step(S, entering ? { home: 0.02, unfold: true } : { home: 0.012, drift: true, pointer: pointer.current, active: activeRef.current, obstacle });
          S.fieldIn = Math.min(1, S.fieldIn + 1 / 50);
        }
        draw();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [ready, animate, inView]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerMove = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    pointer.current = [e.clientX - r.left, e.clientY - r.top];
    if (!animate) draw();
  };
  const onLeave = () => {
    pointer.current = null;
    state.leave();
    if (!animate) draw();
  };

  const lit = active ? new Set(neighbours(active)) : null;
  // the card sits in the top corner away from the skill
  const S = simRef.current;
  const cardLeft = active && S ? S.bodies[active].hx > S.W / 2 : false;
  const order = IDS;
  const moveFocus = (id, by) => {
    const next = order[(order.indexOf(id) + by + order.length) % order.length];
    svgRef.current?.querySelector(`[data-skill="${next}"]`)?.focus();
  };

  return (
    <section ref={sectionRef} id="map" aria-labelledby="map-title" className="relative scroll-mt-16 bg-bone" onKeyDown={heroKeys(state)}>
      <style>{`
        .fld-node, .fld-node:focus-visible, .fld-leaf:focus-visible { outline: none; }
        .fld-node:focus-visible .fld-focus, .fld-leaf:focus-visible .fld-focus { opacity: 1; }
        .fld-leaf { outline: none; }
        .fld-fade { transition: opacity 200ms ease, fill 200ms ease, stroke 200ms ease; }
        .fld-card { animation: fld-in 240ms cubic-bezier(0.23, 1, 0.32, 1) both; }
        @keyframes fld-in { from { opacity: 0; transform: translateY(6px); } }
        .fld-leaf-in { animation: fld-leaf 360ms cubic-bezier(0.23, 1, 0.32, 1) both; }
        @keyframes fld-leaf { from { opacity: 0; } }
      `}</style>
      <h2 id="map-title" className="sr-only">
        Skill map
      </h2>

      <div className="hidden h-[calc(100svh-65px)] min-h-[620px] flex-col map:flex">
        <div ref={stageRef} className="relative min-h-0 flex-1" onPointerMove={onPointerMove} onPointerLeave={onLeave}>
          <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
          {ready && (
            <svg ref={svgRef} className="absolute inset-0 h-full w-full overflow-visible" role="group" aria-label="Skills, linked where they feed into each other; larger points carry more projects. Select one for its tools and projects.">
              <g aria-hidden="true" fill="none">
                {EDGES.map(([a, c]) => {
                  const key = `${a}-${c}`;
                  const hot = active && (a === active || c === active);
                  return (
                    <g key={key}>
                      <path
                        ref={(el) => {
                          edgeEls.current[key] = edgeEls.current[key] || [];
                          edgeEls.current[key][0] = el;
                        }}
                        className="fld-fade"
                        style={{ stroke: "rgb(var(--ink))", opacity: active && !hot ? 0.2 : 0.7 }}
                        strokeWidth="1.25"
                      />
                      <path
                        ref={(el) => {
                          edgeEls.current[key] = edgeEls.current[key] || [];
                          edgeEls.current[key][1] = el;
                        }}
                        className="fld-fade"
                        style={{ stroke: "rgb(var(--olive))", opacity: hot ? 1 : 0 }}
                        strokeWidth="2.5"
                      />
                    </g>
                  );
                })}
              </g>

              {/* leaves: the projects of the picked skill */}
              {active &&
                work.map((w, i) => (
                  <g key={`${active}-${w.id}`} className="fld-leaf-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <path
                      ref={(el) => {
                        leafEls.current[w.id] = { ...(leafEls.current[w.id] || {}), line: el };
                      }}
                      aria-hidden="true"
                      style={{ stroke: "rgb(var(--olive))" }}
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <g
                      ref={(el) => {
                        leafEls.current[w.id] = { ...(leafEls.current[w.id] || {}), g: el };
                      }}
                      className="fld-leaf"
                      data-leaf={w.id}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open ${mapTitle(w)}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/projects/${w.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") router.push(`/projects/${w.id}`);
                        if (e.key === "Escape") svgRef.current?.querySelector(`[data-skill="${active}"]`)?.focus();
                      }}
                    >
                      <circle r="20" fill="transparent" />
                      <circle className="fld-focus" r="11" fill="none" style={{ stroke: "rgb(var(--olive))", opacity: 0 }} strokeWidth="3" />
                      <circle r="5" style={{ fill: "rgb(var(--olive))" }} />
                      <text
                        ref={(el) => {
                          leafEls.current[w.id] = { ...(leafEls.current[w.id] || {}), t: el };
                        }}
                        y="5"
                        fontFamily="Inter Tight, sans-serif"
                        fontSize={LEAF}
                        fontWeight="600"
                        className="underline-offset-2 hover:underline"
                        style={{ fill: "rgb(var(--ink))", paintOrder: "stroke", stroke: "rgb(var(--bone))", strokeWidth: 5, strokeLinejoin: "round" }}
                      >
                        {mapTitle(w)} ↗
                      </text>
                    </g>
                  </g>
                ))}

              {IDS.map((id) => {
                const b = S ? S.bodies[id] : null;
                const side = b ? b.side : "r";
                const r = dotR(id);
                const isActive = active === id;
                const isLit = lit && lit.has(id);
                const quiet = active && !isActive && !isLit;
                return (
                  <g
                    key={id}
                    ref={(el) => {
                      nodeEls.current[id] = el;
                    }}
                    data-skill={id}
                    className="fld-node"
                    tabIndex={0}
                    role="button"
                    aria-pressed={state.pinned === id}
                    aria-label={skillAria(id, projects)}
                    style={{ cursor: "pointer" }}
                    onPointerEnter={() => state.enter(id)}
                    onPointerLeave={() => state.cancel()}
                    onFocus={() => state.show(id)}
                    onClick={() => state.toggle(id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        state.pin(id);
                        setTimeout(() => svgRef.current?.querySelector("[data-leaf]")?.focus(), 30);
                      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                        e.preventDefault();
                        moveFocus(id, 1);
                      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                        e.preventDefault();
                        moveFocus(id, -1);
                      }
                    }}
                  >
                    <circle r={Math.max(22, r + 10)} fill="transparent" />
                    <rect x={side === "r" ? r + 4 : -r - 16 - (b ? b.lw : 100)} y={-14} width={(b ? b.lw : 100) + 12} height={28} fill="transparent" />
                    <circle className="fld-focus" r={r + 7} fill="none" style={{ stroke: "rgb(var(--olive))", opacity: 0 }} strokeWidth="3" />
                    {isActive && <circle r={r + 6} fill="none" style={{ stroke: "rgb(var(--ink))" }} strokeWidth="1.5" />}
                    <circle
                      className="skill-dot fld-fade"
                      r={r}
                      style={{ fill: isActive ? "rgb(var(--olive))" : isLit ? "rgb(var(--ink))" : "rgb(var(--bone))", stroke: isActive ? "rgb(var(--olive))" : "rgb(var(--ink))" }}
                      strokeWidth="1.75"
                    />
                    <text
                      className="fld-label fld-fade"
                      x={side === "r" ? r + 9 : -r - 9}
                      y="5.5"
                      textAnchor={side === "r" ? "start" : "end"}
                      fontFamily="Inter Tight, sans-serif"
                      fontSize={LABEL}
                      fontWeight="500"
                      style={{ fill: isActive ? "rgb(var(--olive))" : "rgb(var(--ink))", opacity: quiet ? 0.4 : 1, paintOrder: "stroke", stroke: "rgb(var(--bone))", strokeWidth: 5, strokeLinejoin: "round" }}
                    >
                      {labelOf(id)}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* the skill: what it is and the tools behind it; its projects are the leaves */}
          {active && (
            <div
              ref={cardRef}
              key={active}
              className="fld-card pointer-events-none absolute top-6 w-[320px] border-t border-ink bg-bone/90 pt-4"
              style={cardLeft ? { left: S ? S.area[0] : 32 } : { right: S ? S.W - S.area[2] : 32 }}
            >
              <SkillCard id={active} projects={projects} showWork={false} compact />
            </div>
          )}
          <p className="sr-only" aria-live="polite">
            {liveLine(active)}
          </p>
        </div>

        {/* the statement closes the first screen, as on the default hero */}
        <div className="fld-band fu-gutter grid grid-cols-12 items-end gap-x-8 pb-12 pt-4">
          <Statement active={active} state={state} className="fu-display col-span-9 leading-[1.06]" style={{ fontSize: "clamp(30px, 4.8vh, 48px)" }} />
          <p className="col-span-3 justify-self-end whitespace-nowrap pb-[0.35em] text-right font-mono text-[14px] leading-relaxed text-graphite">{AVAILABLE}</p>
        </div>
      </div>

      <PhoneHero projects={projects} />
    </section>
  );
};

export default Field;
