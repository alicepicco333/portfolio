import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { gsap } from "gsap";
import {
  NODES,
  EDGES,
  neighbours,
  nodeOf,
  labelOf,
  CLUSTERS,
  clusterOf,
  SKILL_NOTES,
  MAP,
} from "../Graph/data";
import { useIsomorphicLayoutEffect, withBase } from "../../utils";
import { textWidth, overlapArea } from "../../utils/layout";
import { scramble, drawIn, motionOn } from "../../utils/motion";

const shortTitle = (title) => title.split(" - ")[0];
const mapTitle = (p) => p.short || shortTitle(p.title);
const HALO = { paintOrder: "stroke", stroke: "rgb(var(--bone))", strokeWidth: 6, strokeLinejoin: "round" };

// ——— desktop geometry ———
// G maps the map's design coordinates onto the stage. Positions stretch to the room the hero has;
// text and node sizes never do, so labels read the same on a laptop and on a wide monitor.
const G = { kx: 1, ky: 1, ox: 0, oy: 0, x0: 0, y0: 0, W: MAP.W, H: MAP.H };
const place = ([x, y]) => [G.ox + (x - G.x0) * G.kx, G.oy + (y - G.y0) * G.ky];
// each verb sits inside its own cluster
const CLUSTER_AT = { ...MAP.clusters, counting: [450, 650], ordering: [140, 790] };
const pos = (id) => place(MAP.pos[id]);
const clusterPos = (id) => place(CLUSTER_AT[id]);
const stageW = () => G.W;
// the hero's side margin: the page gutter, and on wide screens a centred 1600 px frame
const gutterOf = (vw) => Math.max(32, (vw - 1600) / 2 + 32);
const LABEL_SCALE = 16 / 18; // labels are drawn at 18 units: 16 px on screen
function labelBox(id) {
  const [x, y] = pos(id);
  const [dx, dy, anchor] = MAP.label[id];
  const w = textWidth(labelOf(id), 18) * 1.1;
  const left = anchor === "end" ? x + dx - w : x + dx;
  return [left - 10, y + dy - 18, left + w + 10, y + dy + 7];
}
const nodeBox = (id) => [pos(id)[0] - 15, pos(id)[1] - 15, pos(id)[0] + 15, pos(id)[1] + 15];
const clusterBox = (c) => {
  const [x, y] = clusterPos(c.id);
  return [x, y - 16, x + textWidth(c.label, 16, true) * 1.2, y + 4];
};
const staticBoxes = () => [...NODES.map((n) => labelBox(n.id)), ...NODES.map((n) => nodeBox(n.id)), ...CLUSTERS.map(clusterBox)];

// every anchor (node or verb) with how far its own ink reaches on each side, in design units;
// `widths` are the labels' rendered lengths once the fonts are in (estimates before that)
const itemsFor = (widths = {}) => [
  ...NODES.map((n) => {
    const [x, y] = MAP.pos[n.id];
    const [dx, dy, anchor] = MAP.label[n.id];
    const w = widths[n.id] || textWidth(labelOf(n.id), 18) * 1.1;
    const left = anchor === "end" ? x + dx - w : x + dx;
    return { x, y, l: x - Math.min(left, x - 7), r: Math.max(left + w, x + 7) - x, t: y - Math.min(y + dy - 18, y - 7), b: Math.max(y + dy + 7, y + 7) - y };
  }),
  ...CLUSTERS.map((c) => {
    // raw coordinates: the verb's text runs right from its anchor
    const [x, y] = CLUSTER_AT[c.id];
    return { x, y, l: 0, r: textWidth(c.label, 16, true) * 1.2, t: 16, b: 4 };
  }),
];
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

// Put a skill's tools (inner arc) and projects (outer arc) on the side of the node with the
// most free room: every direction is scored by how much it would cover or leave the frame.
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

// Projects fan out from the selected skill: try every direction, radius and spread and keep
// the one that covers nothing.
function fanLayout(id, works) {
  const [ox, oy] = pos(id);
  const boxes = staticBoxes();
  let leaves = null;
  for (let deg = 0; deg < 360; deg += 5) {
    const a = (deg * Math.PI) / 180;
    [180, 210, 245, 285, 320].forEach((rl) => {
      [0.22, 0.3, 0.4, 0.55].forEach((spread) => {
        const pts = works.map((p, i) => {
          const b = a + (i - (works.length - 1) / 2) * spread;
          const x = ox + rl * Math.cos(b);
          const y = oy + rl * Math.sin(b);
          const right = Math.cos(b) >= -0.2;
          const w = textWidth(`${mapTitle(p)} ↗`, 17) * 1.12 + 6;
          return { p, x, y, right, box: grow(right ? [x - 19, y - 20, x + 26 + w, y + 20] : [x - 26 - w, y - 20, x + 19, y + 20], 6) };
        });
        const score = cost(pts.map((o) => o.box), boxes);
        if (!leaves || score < leaves.score) leaves = { score, pts };
      });
    });
  }
  return { leafPts: leaves.pts };
}

// a plain key press inside this section, not typing in a field and not a browser shortcut
const plainKey = (e) => !(e.metaKey || e.ctrlKey || e.altKey) && !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);
// the statement's phrases, each opening the part of the map it names
const PHRASES = [
  ["complex information", "dv"],
  ["easy to understand and trust", "ux"],
  ["test it with the people who use it", "ur"],
];
// 1 to 5 select the first skill of each step of the method: listen, order, count, shape, play
const STEP_KEYS = ["listening", "ordering", "counting", "shaping", "playing"];

const SkillMap = ({ projects }) => {
  const router = useRouter();
  // the map rests quietly: the whole network in grey with plain labels; a hovered, focused or picked skill
  // lights its own lines and neighbours and opens its card
  const quiet = true;
  // the statement as a headline above the graph; `?hero=now` / `?hero=caption` show the earlier placements
  const [heroMode, setHeroMode] = useState("band");
  const bandRef = useRef(null);
  const TOP = heroMode === "band" ? 0 : 70; // the earlier placements crop the empty strip above the graph
  const SH = MAP.H - TOP;
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("hero");
    if (m === "now" || m === "caption") setHeroMode(m);
  }, []);
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [chipW, setChipW] = useState({});
  const labelRefs = useRef({});
  const [fit, setFit] = useState(null);
  const [frameH, setFrameH] = useState(null);
  const [sx, setSx] = useState(1);
  const [box, setBox] = useState(null);
  const frameRef = useRef(null);
  const stageRef = useRef(null);
  const narrowRef = useRef(null);
  const active = pinned;

  // `?skill=<id>` opens the map on that skill
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("skill");
    if (id && nodeOf(id)) setPinned(id);
  }, []);

  // scale the 1440 × 920 stage to the first screen, but never below 80% so labels stay readable;
  // on short screens the map then runs a little taller than the window
  useEffect(() => {
    const measure = () => {
      const el = frameRef.current;
      if (!el || !el.clientWidth) return; // hidden on phones: nothing to fit
      const band = bandRef.current?.offsetHeight || 0;
      if (heroMode === "band") {
        // one frame: the graph's outermost labels sit on the page gutters; 64 px under the header,
        // 64 px to the headline, which closes the first screen 48 px above the fold
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
        G.kx = fx.k;
        G.ky = fy.k;
        G.ox = fx.offset;
        G.oy = fy.offset;
        G.x0 = 0;
        G.y0 = 0;
        G.W = Wu;
        G.H = Hu;
        setBox({ left: gut, top: 64, w: pxW, h: pxH });
        setSx(G.kx + G.ky / 1000);
        setFit(LABEL_SCALE);
        setFrameH(pxH + 128);
        return;
      }
      // band: air around the graph, the page's 32 px gutter at the sides and a little under the header
      const AIR = heroMode === "band" ? { x: 32, top: 16 } : { x: 0, top: 0 };
      const room = window.innerHeight - (document.querySelector("header")?.offsetHeight || 65) - band - AIR.top;
      const availW = el.clientWidth - 2 * AIR.x;
      const h = MAP.H - (heroMode === "band" ? 70 : 0);
      // band: the first screen is fitted exactly, however short the window; the earlier placements keep their floor
      const f = heroMode === "band" ? Math.min(availW / MAP.W, Math.max(0.4, room / h)) : Math.min(el.clientWidth / MAP.W, Math.max(0.8, Math.max(480, room) / h));
      const SX = Math.min(1.6, Math.max(1, availW / (MAP.W * f)));
      Object.assign(G, { kx: SX, ky: 1, ox: 0, oy: 0, x0: 0, y0: 0, W: MAP.W * SX, H: MAP.H });
      setSx(SX);
      setFit(f);
      setFrameH(heroMode === "band" ? room + AIR.top : Math.max(Math.max(480, room), h * f));
    };
    measure();
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [heroMode]);

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
  const fan = useMemo(() => (activeNode ? fanLayout(active, activeWork) : null), [active, sx]); // eslint-disable-line react-hooks/exhaustive-deps
  const lit = activeNode ? new Set(neighbours(active)) : new Set();

  // ——— motion ———
  useIsomorphicLayoutEffect(() => {
    if (!fit) return undefined;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!motionOn()) return;
      const s = stageRef.current;
      if (s && s.offsetParent !== null) {
        const q = (sel) => Array.from(s.querySelectorAll(sel));
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(q(".map-intro > *"), { y: 26, duration: 0.9, stagger: 0.1 }, 0);
        drawIn(gsap, q(".map-edge"), { at: 0.25, step: 0.035, duration: 0.7 });
        tl.from(q(".map-node"), { scale: 0, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.035, ease: "back.out(2.2)" }, 0.35);
        tl.from(q(".map-chip-g"), { opacity: 0, y: 6, duration: 0.5, stagger: 0.025 }, 0.7);
        q(".map-cluster").forEach((el, i) => scramble(gsap, el, 0.9 + i * 0.18));
      }
      const n = narrowRef.current;
      if (n && n.offsetParent !== null) {
        const q = (sel) => Array.from(n.querySelectorAll(sel));
        gsap.from(q(".map-intro > *"), { y: 20, duration: 0.8, stagger: 0.1, ease: "power3.out" });
        drawIn(gsap, q(".map-edge"), { at: 0.2, step: 0.03, duration: 0.6 });
        gsap.from(q(".map-node"), { scale: 0, transformOrigin: "50% 50%", duration: 0.45, stagger: 0.03, delay: 0.3, ease: "back.out(2)" });
      }
    });
    return () => mm.revert();
  }, [fit !== null]);

  // new skill: fan its projects out, and let the node glow
  useIsomorphicLayoutEffect(() => {
    if (!fit || !active) return undefined;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!motionOn()) return;
      const s = stageRef.current;
      if (!s) return;
      const [x, y] = pos(active);
      gsap.from(s.querySelectorAll(".fan-item"), {
        x: (i, el) => x - Number(el.dataset.x),
        y: (i, el) => y - Number(el.dataset.y),
        scale: 0.3,
        opacity: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: "expo.out",
      });
      drawIn(gsap, Array.from(s.querySelectorAll(".fan-line")), { duration: 0.45 });
    });
    return () => mm.revert();
  }, [active, fit]);

  const toggle = (id) => setPinned((current) => (current === id ? null : id));
  const statement = (
    <>
                  <>
                    I&rsquo;m an HCI researcher and designer. I make{" "}
                    {PHRASES.map(([text, id], i) => (
                      <React.Fragment key={id}>
                        {i === 1 && " "}
                        {i === 2 && ", and I "}
                        {/* a span, not a <button>: buttons cannot wrap mid-phrase, and the sentence must read as one */}
                        <span
                          role="button"
                          tabIndex={0}
                          aria-pressed={active === id}
                          aria-label={`${text}: show ${labelOf(id)} in the map`}
                          onMouseEnter={() => setPinned(id)}
                          onFocus={() => setPinned(id)}
                          onClick={() => setPinned(id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setPinned(id);
                            }
                          }}
                          className={`cursor-pointer underline decoration-2 underline-offset-[6px] transition-[text-decoration-color,color] duration-150 hover:text-olive ${active === id ? "text-olive decoration-olive" : "decoration-ink/25"}`}
                        >
                          {text}
                        </span>
                      </React.Fragment>
                    ))}
                    .
                  </>
</>
  );
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
  const [ax, ay] = active ? pos(active) : [0, 0];

  return (
    <section
      id="map"
      aria-labelledby="map-title"
      className="relative scroll-mt-16 bg-bone"
      onKeyDown={(e) => {
        const i = "12345".indexOf(e.key);
        if (i < 0 || !plainKey(e)) return;
        const c = CLUSTERS.find((x) => x.id === STEP_KEYS[i]);
        if (c) setPinned(c.skills[0]);
      }}
    >
      <h2 id="map-title" className="sr-only">Skill map</h2>
      {/* ——— desktop and tablet: the fixed stage ——— */}
      <div ref={frameRef} className="relative hidden h-[calc(100svh-64px)] w-full map:block" style={frameH ? { height: frameH } : undefined}>
        <div
          className="absolute"
          style={
            heroMode === "band" && box
              ? { left: box.left, top: box.top, width: box.w, height: box.h, visibility: fit ? "visible" : "hidden" }
              : { left: "50%", top: "50%", width: G.W * (fit || 1), height: SH * (fit || 1), transform: "translate(-50%, -50%)", visibility: fit ? "visible" : "hidden" }
          }
        >
          <div
            ref={stageRef}
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: G.W, height: heroMode === "band" ? G.H : SH, transform: `scale(${fit || 1})` }}
            onMouseLeave={() => setPinned(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setPinned(null);
            }}
          >
            <svg viewBox={heroMode === "band" ? `0 0 ${G.W} ${G.H}` : `0 ${TOP} ${G.W} ${SH}`} className="absolute inset-0 h-full w-full overflow-visible" role="group" aria-label="Skills, linked where they feed into each other. Select one to see its tools and projects.">
              <defs>
              </defs>
              <g aria-hidden="true">
                {CLUSTERS.map((c) => (
                  <text
                    key={c.id}
                    className="map-cluster"
                    x={clusterPos(c.id)[0]}
                    y={clusterPos(c.id)[1]}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="16"
                    fontWeight="500"
                    letterSpacing="0.18em"
                    style={{ fill: "rgb(var(--olive))" }}
                    opacity={1}
                  >
                    {c.label.toUpperCase()}
                  </text>
                ))}
              </g>

              <g aria-hidden="true">
                {EDGES.map(([a, b]) => {
                  const hot = active && (a === active || b === active);
                  const [x1, y1] = pos(a);
                  const [x2, y2] = pos(b);
                  return (
                    <line
                      key={`${a}-${b}`}
                      className="map-edge"
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      style={{ stroke: hot ? "rgb(var(--olive))" : "rgb(var(--ink))", transition: "stroke .3s, stroke-width .3s, opacity .3s" }}
                      strokeWidth={hot ? 3 : 1}
                      opacity={hot ? 1 : active ? 0.22 : 0.4}
                    />
                  );
                })}
              </g>

              {fan && (
                <g key={active}>
                  {fan.leafPts.map(({ p, x, y, right }) => (
                    <g key={`w-${p.id}`} className="fan-item" data-x={x} data-y={y} {...nodeProps(`Open ${mapTitle(p)}`, () => goTo(p.id))} role="link">
                      <line className="fan-line" x1={ax} y1={ay} x2={x} y2={y} style={{ stroke: "rgb(var(--olive))" }} strokeWidth="1.5" />
                      <circle cx={x} cy={y} r="6" style={{ fill: "rgb(var(--olive))" }} />
                      {<text
                        x={right ? x + 14 : x - 14}
                        y={y + 5}
                        textAnchor={right ? "start" : "end"}
                        fontFamily="Inter Tight, sans-serif"
                        fontSize="17"
                        fontWeight="600"
                        className="underline-offset-2 hover:underline"
                        style={{ fill: "rgb(var(--ink))", ...HALO }}
                      >
                        {mapTitle(p)} ↗
                      </text>}
                    </g>
                  ))}
                </g>
              )}

              {NODES.map((n) => {
                const [x, y] = pos(n.id);
                const [dx, dy, anchor] = MAP.label[n.id];
                const isActive = active === n.id;
                const isLit = lit.has(n.id);
                return (
                  <g
                    key={n.id}
                    {...nodeProps(skillLabel(n.id), () => toggle(n.id))}
                    aria-pressed={pinned === n.id}
                    onMouseEnter={() => {
                      setHovered(n.id);
                      setPinned(n.id);
                    }}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => {
                      setHovered(n.id);
                      setPinned(n.id);
                    }}
                    onBlur={() => setHovered(null)}
                  >
                    <circle cx={x} cy={y} r="22" fill="transparent" />
                    {/* the selected skill: a crisp ink ring around the node, no glow */}
                    {isActive && <circle className="map-ring" cx={x} cy={y} r="21" fill="none" style={{ stroke: "rgb(var(--ink))" }} strokeWidth="1.5" />}
                    <circle
                      className="map-node"
                      cx={x}
                      cy={y}
                      r={isActive ? 13 : 6.5}
                      style={{
                        fill: isActive ? "rgb(var(--olive))" : isLit ? "rgb(var(--ink))" : "rgb(var(--bone))",
                        stroke: isActive ? "rgb(var(--olive))" : "rgb(var(--ink))",
                        transition: "all .25s",
                      }}
                      strokeWidth="1.5"
                    />
                    <g className="map-chip-g">
                      {/* quiet: only the selected skill and its neighbours wear a chip; the rest read as plain grey labels */}
                      {!(quiet && !isActive && !isLit && hovered !== n.id) && (() => {
                        const tw = (chipW[n.id] || textWidth(n.label, 18)) * (isActive || isLit ? 1.05 : 1);
                        const left = anchor === "end" ? x + dx - tw : x + dx;
                        return (
                          <rect
                            className="map-chip"
                            x={left - 10}
                            y={y + dy - 18}
                            width={tw + 20}
                            height="25"
                            style={{ fill: isActive ? "rgb(var(--olive))" : hovered === n.id ? "color-mix(in srgb, rgb(var(--olive)) 16%, #fff)" : "rgb(var(--paper))", stroke: isActive || hovered === n.id ? "rgb(var(--olive))" : isLit ? "rgb(var(--ink))" : "rgb(var(--concrete))", transition: "fill .2s, stroke .2s" }}
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
                        textAnchor={anchor}
                        fontFamily="Inter Tight, sans-serif"
                        fontSize="18"
                        fontWeight={isActive ? 700 : isLit ? 600 : 400}
                        style={{
                          fill: isActive ? "#fff" : hovered === n.id ? "rgb(var(--olive))" : quiet && !isLit ? "rgb(var(--graphite))" : "rgb(var(--ink))",
                          transition: "fill .2s",
                          // a plain label (no chip) keeps the lines off its letters with a halo in the page colour
                          ...(quiet && !isActive && !isLit && hovered !== n.id ? HALO : {}),
                        }}
                      >
                        {n.label}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {heroMode !== "band" && (
              <div className={`map-intro absolute left-8 top-9 flex flex-col gap-3 ${heroMode === "caption" ? "w-[470px]" : "w-[640px]"}`}>
                <p className={heroMode === "caption" ? "text-phi1 font-medium leading-[1.25] tracking-[-0.01em]" : "text-[34px] font-medium leading-[1.16] tracking-[-0.015em]"}>{statement}</p>
              </div>
            )}

            {/* no card: the projects are the labels at the ends of the lines; screen readers hear the skill */}
            <p className="sr-only" aria-live="polite">
              {activeNode ? `${activeNode.label}. ${SKILL_NOTES[active]} Tools: ${activeNode.tools.join(", ")}.` : ""}
            </p>

          </div>
        </div>
      </div>

      {/* the statement closes the first screen, just above the fold */}
      {heroMode === "band" && (
        <div ref={bandRef} className="map-intro fu-gutter hidden grid-cols-12 items-end gap-x-8 pb-12 map:grid">
          <p className="fu-display col-span-9 leading-[1.06]" style={{ fontSize: "clamp(32px, 5vh, 48px)" }}>{statement}</p>
          <p className="col-span-3 justify-self-end whitespace-nowrap pb-[0.35em] text-right font-mono text-[14px] leading-relaxed text-graphite">Available for freelance · Amsterdam</p>
        </div>
      )}
      {/* ——— phones and tablets: the statement only; the map needs a wide screen ——— */}
      <div ref={narrowRef} className="relative overflow-hidden px-4 pb-16 pt-14 fu-gutter tablet:pb-24 tablet:pt-20 map:hidden">
        <div className="map-intro relative flex max-w-[720px] flex-col gap-6">
          <p className="text-[34px] font-medium leading-[1.12] tracking-[-0.02em] tablet:text-[52px]">
            I&rsquo;m an HCI researcher and designer. I make complex information easy to understand and trust, and I test it with the people who use it.
          </p>
          {/* the work, straight away: the three projects that lead Selected work */}
          <ul className="grid grid-cols-3 gap-3">
            {[...projects].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)).slice(0, 3).map((w) => (
              <li key={w.id}>
                <Link href={`/projects/${w.id}`} className="flex flex-col gap-1.5 text-[14px] font-semibold leading-tight">
                  <img src={withBase(w.cardWebp || w.cardImage)} alt="" className="aspect-[4/3] w-full border border-ink object-cover" loading="eager" draggable={false} />
                  <span>{mapTitle(w)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <a href="#work" className="inline-flex min-h-[44px] w-max items-center border-b-2 border-olive font-mono text-[14px] text-olive">
            All work
          </a>
        </div>
      </div>
    </section>
  );
};

export default SkillMap;
