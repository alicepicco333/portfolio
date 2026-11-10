// ?hero=orbit: the method as a ring, read clockwise from the top. The five verbs are written into the
// line itself (listen, order, count, shape, play); the skills sit on it at an even step. A link between
// two neighbours on the ring is the ring drawn in ink; longer links run inside on concentric lanes, so
// the middle stays free for the card. A signal travels the ring and the middle reads out the step it is
// in; the pointer turns it like a dial, and a skill under the pointer pulls it to itself.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { EDGES, neighbours, labelOf } from "../Graph/data";
import {
  STEPS,
  stepOf,
  weightOf,
  measure,
  useFontsReady,
  useSize,
  useAnimate,
  canAnimate,
  useInView,
  useSkillState,
  heroKeys,
  Statement,
  SkillCard,
  StepNote,
  PhoneHero,
  AVAILABLE,
  liveLine,
  skillAria,
} from "./shared";

// inside each step the skills sit so that links cross as little as possible (two crossings, both square);
// speculative design sits between UX and interaction design, next to the one skill it links to
const ORDER = { listening: ["hci", "ur", "anth"], ordering: ["arch", "onto"], counting: ["dv"], shaping: ["vis", "ux", "spec", "ixd"], playing: ["live"] };
// any skill added to the data later still gets a place: at the end of its step
STEPS.forEach((s) => s.skills.forEach((id) => !ORDER[s.id].includes(id) && ORDER[s.id].push(id)));
const RING_IDS = STEPS.flatMap((s) => ORDER[s.id]);
const LABEL = 16;
const VERB = 14;
const VERB_TRACK = 0.04;
const LANE0 = 26; // first lane, inside the ring
const LANE_STEP = 14;
const TAU = Math.PI * 2;
const SPEED = TAU / 38; // one turn of the method in 38 s
const nodeR = (id) => 4 + 2 * weightOf(id); // the skills with more projects sit heavier on the ring
const wrap = (a) => ((a % TAU) + TAU) % TAU;
const diff = (a, b) => {
  const d = wrap(b - a);
  return d > Math.PI ? d - TAU : d;
};
const pt = (cx, cy, r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
const f1 = (v) => Math.round(v * 10) / 10;
const arc = (cx, cy, r, a0, a1, rev = false) => {
  const [x0, y0] = pt(cx, cy, r, a0);
  const [x1, y1] = pt(cx, cy, r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return rev ? `M${f1(x1)} ${f1(y1)}A${r} ${r} 0 ${large} 0 ${f1(x0)} ${f1(y0)}` : `M${f1(x0)} ${f1(y0)}A${r} ${r} 0 ${large} 1 ${f1(x1)} ${f1(y1)}`;
};
const idx = (id) => RING_IDS.indexOf(id);
const consecutive = (a, b) => {
  const d = Math.abs(idx(a) - idx(b));
  return d === 1 || d === RING_IDS.length - 1;
};

// angles only depend on R: the verbs take the room their words need, the skills share the rest evenly
function angles(R, widths) {
  const gaps = STEPS.map((s) => widths[s.id] + 30);
  const slot = (TAU * R - gaps.reduce((a, b) => a + b, 0)) / RING_IDS.length;
  let a = -gaps[0] / 2 / R;
  const verbs = [];
  const nodes = {};
  const steps = [];
  STEPS.forEach((s, i) => {
    const a0 = a;
    a += gaps[i] / R;
    verbs.push({ id: s.id, verb: s.verb, a0, a1: a });
    const s0 = a;
    ORDER[s.id].forEach((id) => {
      nodes[id] = { a: a + slot / 2 / R, half: slot / 2 / R };
      a += slot / R;
    });
    steps.push({ id: s.id, a0: s0, a1: a });
  });
  return { verbs, nodes, steps };
}

function labelAt(id, a, R, cx, cy, w) {
  const rn = nodeR(id);
  const [nx, ny] = pt(cx, cy, R, a);
  const s = Math.sin(a);
  const c = Math.cos(a);
  const off = rn + 10;
  const px = nx + s * off;
  const py = ny - c * off;
  let anchor = "middle";
  let base = c > 0 ? py - 3 : py + 14;
  let x = px;
  if (s > 0.3 || s < -0.3) {
    anchor = s > 0 ? "start" : "end";
    base = py + 5.5;
    // near the top and bottom the outward step is mostly vertical: keep the text clear of the dot
    x = nx + Math.sign(s) * Math.max(Math.abs(s) * off, rn + 7);
  }
  const left = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
  return { anchor, x, y: base, box: [left - 4, base - 15, left + w + 4, base + 5] };
}

// the largest ring whose labels fit the stage
function layout(W, H, labelW, verbW) {
  const extent = (R) => {
    const g = angles(R, verbW);
    let [x0, y0, x1, y1] = [-R, -R, R, R];
    RING_IDS.forEach((id) => {
      const b = labelAt(id, g.nodes[id].a, R, 0, 0, labelW[id]).box;
      x0 = Math.min(x0, b[0]);
      y0 = Math.min(y0, b[1]);
      x1 = Math.max(x1, b[2]);
      y1 = Math.max(y1, b[3]);
    });
    return [x0, y0, x1, y1];
  };
  let lo = 120;
  let hi = 520;
  for (let i = 0; i < 30; i += 1) {
    const m = (lo + hi) / 2;
    const [x0, y0, x1, y1] = extent(m);
    if (x1 - x0 <= W - 16 && y1 - y0 <= H - 64) lo = m;
    else hi = m;
  }
  const R = Math.floor(lo);
  const [x0, y0, x1, y1] = extent(R);
  const cx = W / 2 - (x0 + x1) / 2;
  const cy = H / 2 - (y0 + y1) / 2 + 6;
  const g = angles(R, verbW);
  const Rd = R - LANE0 - LANE_STEP * 2 - 16; // the free middle

  const labels = {};
  RING_IDS.forEach((id) => {
    labels[id] = labelAt(id, g.nodes[id].a, R, cx, cy, labelW[id]);
  });

  // links: neighbours on the ring follow the ring; the rest run on lanes inside it
  const ring = [];
  const lanes = [];
  EDGES.forEach(([p, q]) => {
    if (consecutive(p, q)) {
      // from the one before to the one after, clockwise, around a verb if one sits between them
      const [a, b] = wrap(g.nodes[q].a - g.nodes[p].a) < Math.PI ? [p, q] : [q, p];
      const a0 = g.nodes[a].a;
      let a1 = g.nodes[b].a;
      if (a1 < a0) a1 += TAU;
      const v = g.verbs.find((x) => x.a0 > a0 && x.a1 < a1 + 1e-6);
      const parts = v ? [[a0, v.a0], [v.a1, a1]] : [[a0, a1]];
      ring.push({ id: `${p}-${q}`, ends: [p, q], ds: parts.map(([s, t]) => arc(cx, cy, R, s, t)), at: parts.map(([s, t]) => [s, t - s]) });
    } else {
      const [a, b] = wrap(g.nodes[q].a - g.nodes[p].a) < Math.PI ? [p, q] : [q, p];
      const a0 = g.nodes[a].a;
      const span = wrap(g.nodes[b].a - a0);
      lanes.push({ id: `${p}-${q}`, ends: [p, q], a0, span });
    }
  });
  // shortest first, each on the outermost lane where it touches no other
  lanes.sort((x, y) => x.span - y.span);
  const placed = [];
  lanes.forEach((e) => {
    let lane = 0;
    const hits = (o) => wrap(o.a0 - e.a0) <= e.span + 1e-3 || wrap(e.a0 - o.a0) <= o.span + 1e-3;
    while (placed.some((o) => o.lane === lane && hits(o))) lane += 1;
    e.lane = lane;
    placed.push(e);
    const r = R - LANE0 - lane * LANE_STEP;
    const c = 9;
    const t = c / r;
    const a1 = e.a0 + e.span;
    const [sx, sy] = pt(cx, cy, R, e.a0);
    const [p1x, p1y] = pt(cx, cy, r + c, e.a0);
    const [k1x, k1y] = pt(cx, cy, r, e.a0);
    const [q1x, q1y] = pt(cx, cy, r, e.a0 + t);
    const [q2x, q2y] = pt(cx, cy, r, a1 - t);
    const [k2x, k2y] = pt(cx, cy, r, a1);
    const [p2x, p2y] = pt(cx, cy, r + c, a1);
    const [ex, ey] = pt(cx, cy, R, a1);
    const large = e.span - 2 * t > Math.PI ? 1 : 0;
    e.ds = [
      `M${f1(sx)} ${f1(sy)}L${f1(p1x)} ${f1(p1y)}Q${f1(k1x)} ${f1(k1y)} ${f1(q1x)} ${f1(q1y)}A${r} ${r} 0 ${large} 1 ${f1(q2x)} ${f1(q2y)}Q${f1(k2x)} ${f1(k2y)} ${f1(p2x)} ${f1(p2y)}L${f1(ex)} ${f1(ey)}`,
    ];
  });

  // each skill owns the wedge of ring around it, out to its label: the pointer finds it easily
  const wedges = {};
  RING_IDS.forEach((id) => {
    const { a, half } = g.nodes[id];
    const r0 = Rd + 6;
    const r1 = R + 30;
    const [ax, ay] = pt(cx, cy, r0, a - half);
    const [bx, by] = pt(cx, cy, r1, a - half);
    const [ccx, ccy] = pt(cx, cy, r1, a + half);
    const [dx, dy] = pt(cx, cy, r0, a + half);
    wedges[id] = `M${f1(ax)} ${f1(ay)}L${f1(bx)} ${f1(by)}A${r1} ${r1} 0 0 1 ${f1(ccx)} ${f1(ccy)}L${f1(dx)} ${f1(dy)}A${r0} ${r0} 0 0 0 ${f1(ax)} ${f1(ay)}Z`;
  });

  return { R, cx, cy, Rd, ...g, labels, ring, lanes, wedges };
}

const stepAt = (geo, phi) => {
  // a step runs from the start of its verb to the start of the next one
  const p = wrap(phi - geo.verbs[0].a0);
  let i = 0;
  geo.verbs.forEach((v, k) => {
    if (wrap(v.a0 - geo.verbs[0].a0) <= p) i = k;
  });
  return i;
};
const inVerb = (geo, phi) => geo.verbs.some((v) => wrap(phi - v.a0) <= v.a1 - v.a0);

const Orbit = ({ projects }) => {
  const state = useSkillState();
  const { active } = state;
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const svgRef = useRef(null);
  const signalRef = useRef(null);
  const nodeRefs = useRef({});
  const hotRefs = useRef({});
  const firstLinkRef = useRef(null);
  const size = useSize(stageRef);
  const fonts = useFontsReady();
  const animate = useAnimate();
  const inView = useInView(sectionRef);
  const [step, setStep] = useState(0);
  const entered = useRef(false);
  const ctxRef = useRef(null);

  // laid out once the fonts are in, so the labels are measured once and nothing jumps
  const geo = useMemo(() => {
    if (!fonts || !size || size.w < 200) return null;
    const labelW = Object.fromEntries(RING_IDS.map((id) => [id, measure(labelOf(id), LABEL)]));
    const verbW = Object.fromEntries(STEPS.map((s) => [s.id, measure(s.verb, VERB, { mono: true, tracking: VERB_TRACK })]));
    return layout(size.w, size.h, labelW, verbW);
  }, [size, fonts]);

  // the signal: where it is, where it is pulled, how fast it goes
  const sig = useRef({ phi: 0, vel: SPEED, target: null, mode: "auto" });
  const activeRef = useRef(null);
  activeRef.current = active;

  // entrance: the ring is drawn clockwise from the top, each verb and skill arriving as the line reaches it
  useEffect(() => {
    if (!geo || entered.current) return;
    entered.current = true;
    if (!canAnimate()) return;
    const svg = svgRef.current;
    const q = (sel) => Array.from(svg.querySelectorAll(sel));
    const T = 1.3; // one turn
    const at = (a) => (wrap(a - geo.verbs[0].a0) / TAU) * T;
    ctxRef.current = gsap.context(() => {
      const draw = (el, duration, delay, ease) => {
        const len = el.getTotalLength();
        gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration, delay, ease, clearProps: "strokeDasharray,strokeDashoffset" });
      };
      q(".orb-draw").forEach((el) => draw(el, (Number(el.dataset.span) / TAU) * T, at(Number(el.dataset.a0)), "none"));
      q(".orb-verb").forEach((el) => gsap.from(el, { opacity: 0, duration: 0.35, delay: at(Number(el.dataset.a)) }));
      // each skill grows out of its point on the ring as the line reaches it
      q(".orb-enter").forEach((el) =>
        gsap.from(el, { opacity: 0, scale: 0.55, svgOrigin: el.dataset.o, duration: 0.5, delay: at(Number(el.dataset.a)), ease: "back.out(1.8)" })
      );
      q(".orb-lane").forEach((el, i) => draw(el, 0.7, T * 0.75 + i * 0.1, "power2.inOut"));
      gsap.from(".orb-middle", { opacity: 0, y: 8, duration: 0.6, delay: T, ease: "power3.out" });
      gsap.from(".orb-band > *", { opacity: 0, y: 14, duration: 0.7, stagger: 0.08, ease: "power3.out" });
    }, sectionRef);
    sig.current.phi = geo.verbs[0].a0;
    sig.current.hold = performance.now() + T * 1000;
  }, [geo]);
  useEffect(() => () => ctxRef.current?.revert(), []);

  // the loop: only while the hero is on screen and motion is on
  useEffect(() => {
    if (!geo || !animate || !inView) return undefined;
    let raf;
    let last = performance.now();
    const s = sig.current;
    const pulse = (id) => {
      const dot = nodeRefs.current[id];
      if (dot) dot.animate([{ transform: "scale(1)" }, { transform: "scale(1.45)" }, { transform: "scale(1)" }], { duration: 700, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
      // data leaving the skill: its links light up and fade
      Object.entries(hotRefs.current).forEach(([key, els]) => {
        if (!key.split("-").includes(id) || activeRef.current) return;
        els.forEach((el) => el && el.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0 }], { duration: 1400, easing: "ease-out" }));
      });
    };
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.hidden || now < (s.hold || 0)) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const prev = s.phi;
      const act = activeRef.current;
      const target = act ? geo.nodes[act].a : s.target;
      if (target != null) {
        // a critically damped spring towards the pointer or the skill
        const k = 70;
        const d = diff(s.phi, target);
        s.vel += (d * k - s.vel * 2 * Math.sqrt(k)) * dt;
      } else {
        s.vel += (SPEED - s.vel) * Math.min(1, dt * 2.5);
      }
      s.phi = wrap(s.phi + s.vel * dt);
      // skills the signal has just passed, going forward
      const moved = diff(prev, s.phi);
      if (moved > 0 && moved < 0.5) {
        RING_IDS.forEach((id) => {
          const a = geo.nodes[id].a;
          if (diff(prev, a) > 0 && diff(prev, a) <= moved) pulse(id);
        });
      }
      const el = signalRef.current;
      if (el) {
        const half = 17 / geo.R;
        el.setAttribute("d", arc(geo.cx, geo.cy, geo.R, s.phi - half, s.phi + half));
        el.style.opacity = inVerb(geo, s.phi) ? "0" : "1";
      }
      const i = stepAt(geo, s.phi);
      if (i !== s.step) {
        s.step = i;
        setStep(i);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [geo, animate, inView]);

  // the pointer turns the dial: on the ring it pulls the signal, in the middle it holds, outside it lets go
  const onPointerMove = (e) => {
    if (!geo) return;
    const r = stageRef.current.getBoundingClientRect();
    const dx = e.clientX - r.left - geo.cx;
    const dy = e.clientY - r.top - geo.cy;
    const d = Math.hypot(dx, dy);
    const a = wrap(Math.atan2(dx, -dy));
    const s = sig.current;
    if (d > geo.Rd && d < geo.R + 80) {
      s.target = a;
      if (!animate) {
        s.phi = a;
        const i = stepAt(geo, a);
        if (i !== s.step) {
          s.step = i;
          setStep(i);
        }
      }
    } else if (d <= geo.Rd) s.target = s.phi;
    else s.target = null;
  };
  const onLeave = () => {
    sig.current.target = null;
    state.leave();
  };

  const moveFocus = (id, by) => {
    const next = RING_IDS[(idx(id) + by + RING_IDS.length) % RING_IDS.length];
    svgRef.current?.querySelector(`[data-skill="${next}"]`)?.focus();
  };
  const lit = active ? new Set(neighbours(active)) : null;
  const shownStep = active ? STEPS.indexOf(stepOf(active)) : step;

  return (
    <section ref={sectionRef} id="map" aria-labelledby="map-title" className="relative scroll-mt-16 bg-bone" onKeyDown={heroKeys(state)}>
      <style>{`
        .orb-node, .orb-node:focus-visible { outline: none; }
        .orb-node:focus-visible .orb-focus { opacity: 1; }
        .orb-dot { transform-box: fill-box; transform-origin: center; }
        .orb-middle > * { animation: orb-in 260ms cubic-bezier(0.23, 1, 0.32, 1) both; }
        @keyframes orb-in { from { opacity: 0; transform: translateY(6px); } }
        .orb-fade { transition: opacity 200ms ease, fill 200ms ease, stroke 200ms ease; }
        .orb-color { transition: fill 200ms ease, stroke 200ms ease; }
      `}</style>
      <h2 id="map-title" className="sr-only">
        Skill map
      </h2>

      <div className="hidden h-[calc(100svh-65px)] min-h-[640px] flex-col map:flex">
        {/* the statement opens the hero; the ring answers it */}
        <div className="orb-band fu-gutter grid grid-cols-12 items-end gap-x-8 pt-10">
          <Statement active={active} state={state} className="fu-display col-span-9 leading-[1.06]" style={{ fontSize: "clamp(30px, 4.6vh, 46px)" }} />
          <p className="col-span-3 justify-self-end whitespace-nowrap pb-[0.35em] text-right font-mono text-[14px] leading-relaxed text-graphite">{AVAILABLE}</p>
        </div>

        <div ref={stageRef} className="fu-gutter relative min-h-0 flex-1" onPointerMove={onPointerMove} onPointerLeave={onLeave}>
          {geo && (
            <>
              <svg ref={svgRef} className="absolute inset-0 h-full w-full overflow-visible" role="group" aria-label="Skills on the method ring, read clockwise from listen. Select one for its tools and projects.">
                {/* the ring: one arc per step, broken where its verb is written in */}
                <g aria-hidden="true">
                  {geo.steps.map((s) => (
                    <path
                      key={s.id}
                      className="orb-draw orb-fade"
                      data-a0={s.a0}
                      data-span={s.a1 - s.a0}
                      d={arc(geo.cx, geo.cy, geo.R, s.a0, s.a1)}
                      fill="none"
                      style={{ stroke: "rgb(var(--ink))", opacity: active ? 0.18 : 0.28 }}
                      strokeWidth="1"
                    />
                  ))}
                  {geo.verbs.map((v, i) => {
                    const mid = (v.a0 + v.a1) / 2;
                    const bottom = Math.cos(mid) < 0; // under the middle the words run the other way, so they stay upright
                    const r = bottom ? geo.R + 4.2 : geo.R - 4.2;
                    const on = shownStep === i;
                    return (
                      <g key={v.id} className="orb-verb" data-a={v.a0}>
                        <path id={`orb-v-${v.id}`} d={arc(geo.cx, geo.cy, r, v.a0 - 0.2, v.a1 + 0.2, bottom)} fill="none" />
                        <text fontFamily="JetBrains Mono, monospace" fontSize={VERB} fontWeight={on ? 700 : 500} letterSpacing={`${VERB_TRACK}em`} className="orb-fade" style={{ fill: on ? "rgb(var(--olive))" : "rgb(var(--graphite))" }}>
                          <textPath href={`#orb-v-${v.id}`} startOffset="50%" textAnchor="middle">
                            {v.verb}
                          </textPath>
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* links: ink along the ring between neighbours, lanes inside for the rest */}
                <g aria-hidden="true" fill="none">
                  {[...geo.ring, ...geo.lanes].map((e) => {
                    const hot = active && e.ends.includes(active);
                    const lane = e.lane !== undefined;
                    return (
                      <g key={e.id}>
                        {e.ds.map((d, k) => (
                          <path
                            key={`b${k}`}
                            className={`orb-fade ${lane ? "orb-lane" : "orb-draw"}`}
                            data-a0={lane ? e.a0 : e.at[k][0]}
                            data-span={lane ? e.span : e.at[k][1]}
                            d={d}
                            style={{ stroke: "rgb(var(--ink))", opacity: active && !hot ? 0.22 : 0.8 }}
                            strokeWidth={lane ? 1.25 : 1.5}
                            strokeLinejoin="round"
                          />
                        ))}
                        {e.ds.map((d, k) => (
                          <path
                            key={`h${k}`}
                            ref={(el) => {
                              hotRefs.current[e.id] = hotRefs.current[e.id] || [];
                              hotRefs.current[e.id][k] = el;
                            }}
                            d={d}
                            className="orb-fade"
                            style={{ stroke: "rgb(var(--olive))", opacity: hot ? 1 : 0 }}
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                          />
                        ))}
                      </g>
                    );
                  })}
                </g>

                {/* the signal on the ring */}
                {animate && <path ref={signalRef} aria-hidden="true" fill="none" style={{ stroke: "rgb(var(--olive))", transition: "opacity 120ms" }} strokeWidth="3.5" strokeLinecap="round" />}

                {RING_IDS.map((id) => {
                  const { a } = geo.nodes[id];
                  const [x, y] = pt(geo.cx, geo.cy, geo.R, a);
                  const L = geo.labels[id];
                  const rn = nodeR(id);
                  const isActive = active === id;
                  const isLit = lit && lit.has(id);
                  const quiet = active && !isActive && !isLit;
                  return (
                    <g
                      key={id}
                      data-skill={id}
                      className="orb-node"
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
                          setTimeout(() => firstLinkRef.current?.focus(), 0);
                        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                          e.preventDefault();
                          moveFocus(id, 1);
                        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                          e.preventDefault();
                          moveFocus(id, -1);
                        }
                      }}
                    >
                      <path d={geo.wedges[id]} fill="transparent" />
                      <rect x={L.box[0]} y={L.box[1]} width={L.box[2] - L.box[0]} height={L.box[3] - L.box[1]} fill="transparent" />
                      <circle className="orb-focus" cx={x} cy={y} r={rn + 7} fill="none" style={{ stroke: "rgb(var(--olive))", opacity: 0 }} strokeWidth="3" />
                      {isActive && <circle cx={x} cy={y} r={rn + 6} fill="none" style={{ stroke: "rgb(var(--ink))" }} strokeWidth="1.5" />}
                      <g className="orb-enter" data-a={a} data-o={`${f1(x)} ${f1(y)}`}>
                        <circle
                          ref={(el) => {
                            nodeRefs.current[id] = el;
                          }}
                          className="skill-dot orb-dot orb-color"
                          cx={x}
                          cy={y}
                          r={rn}
                          style={{
                            fill: isActive ? "rgb(var(--olive))" : isLit ? "rgb(var(--ink))" : "rgb(var(--bone))",
                            stroke: isActive ? "rgb(var(--olive))" : "rgb(var(--ink))",
                          }}
                          strokeWidth="1.75"
                        />
                        <text
                          className="orb-fade"
                          x={L.x}
                          y={L.y}
                          textAnchor={L.anchor}
                          fontFamily="Inter Tight, sans-serif"
                          fontSize={LABEL}
                          fontWeight="500"
                          style={{ fill: isActive ? "rgb(var(--olive))" : "rgb(var(--ink))", opacity: quiet ? 0.4 : 1 }}
                        >
                          {labelOf(id)}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>

              {/* the middle: the step the signal is in, or the skill under the pointer */}
              <div
                className="orb-middle pointer-events-none absolute flex items-center justify-center"
                style={{ left: geo.cx - geo.Rd, top: geo.cy - geo.Rd, width: geo.Rd * 2, height: geo.Rd * 2 }}
              >
                <div key={active || `step-${shownStep}`} className="pointer-events-auto" style={{ width: Math.min(340, geo.Rd * 1.45) }}>
                  {active ? (
                    <SkillCard
                      id={active}
                      projects={projects}
                      align="center"
                      compact={geo.Rd < 200}
                      firstLinkRef={firstLinkRef}
                      onLinkKeyDown={(e) => {
                        if (e.key === "Escape") svgRef.current?.querySelector(`[data-skill="${active}"]`)?.focus();
                      }}
                    />
                  ) : (
                    <StepNote step={STEPS[shownStep]} align="center" compact={geo.Rd < 200} />
                  )}
                </div>
              </div>
            </>
          )}
          <p className="sr-only" aria-live="polite">
            {liveLine(active)}
          </p>
        </div>
      </div>

      <PhoneHero projects={projects} />
    </section>
  );
};

export default Orbit;
