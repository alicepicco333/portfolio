// ?hero=flow: the method as a patch read left to right, from first interview to working prototype.
// Five columns (listen, order, count, shape, play) and a sixth for the work they end in. Skills are
// boxes on four rows, cables run from each box's outlet to the next one's inlet, and the rows are chosen
// so no cable crosses another. A pulse leaves the listening column, travels every cable at one speed,
// and arrives in the projects; a picked skill sends its pulse only along its own cables.
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { EDGES, NODES, neighbours, labelOf, nodeOf, SKILL_NOTES } from "../Graph/data";
import {
  STEPS,
  stepOf,
  weightOf,
  measure,
  mapTitle,
  byRank,
  useFontsReady,
  useSize,
  useAnimate,
  canAnimate,
  useInView,
  useSkillState,
  heroKeys,
  Statement,
  SkillCard,
  AVAILABLE,
  liveLine,
  skillAria,
} from "./shared";

// rows that leave every cable uncrossed: the HCI path on top (HCI, interaction design), speculative design
// under interaction design, UX and visual design under that, and data visualization and live coding on
// the bottom row, so data reaches live coding in a straight line under the shaping column
const ROW = { hci: 0, ur: 1, anth: 2, arch: 2, onto: 3, ixd: 0, spec: 1, ux: 2, vis: 3, dv: 4, live: 4 };
// a skill added to the data later still gets a place: the bottom row of its step
NODES.forEach((n) => {
  if (ROW[n.id] === undefined) ROW[n.id] = 1 + Math.max(...Object.values(ROW));
});
const ROWS = 1 + Math.max(...Object.values(ROW));
const COL = Object.fromEntries(NODES.map((n) => [n.id, STEPS.indexOf(stepOf(n.id))]));
const ORDER = [...NODES.map((n) => n.id)].sort((a, b) => COL[a] - COL[b] || ROW[a] - ROW[b]);
const gutterOf = (vw) => Math.max(32, (vw - 1600) / 2 + 32);
const dotD = (id) => 6 + 2 * weightOf(id);
const SPEED = 560; // px per second, on every cable
const f1 = (v) => Math.round(v * 10) / 10;

function layout(W, H, work) {
  const fs = W < 1300 ? 15 : 16;
  const gut = gutterOf(window.innerWidth);
  const titleW = Math.max(...work.map((p) => measure(`${mapTitle(p)} ↗`, fs, { weight: 600 })));
  const workW = titleW + 44;
  const x0 = gut;
  const x1 = W - gut;
  const colW = (x1 - x0 - workW) / 5;
  const colX = (i) => x0 + i * colW;
  const workX = x0 + 5 * colW;
  const top = 44;
  const readH = 118;
  const rowsH = Math.max(240, H - top - readH - 28);
  const pitch = Math.min(104, rowsH / ROWS);
  const rowsTop = top + (rowsH - pitch * ROWS) / 2;
  const rowY = (r) => rowsTop + pitch * (r + 0.5);
  // boxes stay inside their column: tighter padding on narrow screens, and a smaller inset if needed
  const pad = colW < 200 ? 10 : 14;
  const boxes = {};
  NODES.forEach((n) => {
    const w = measure(n.label, fs) + dotD(n.id) + 10 + pad * 2;
    const x = colX(COL[n.id]) + Math.max(8, Math.min(18, colW - w - 14));
    const y = rowY(ROW[n.id]);
    boxes[n.id] = { x, y: y - 20, w, h: 40, cy: y, out: [x + w, y], in: [x, y], pad };
  });
  const items = work.map((p, i) => {
    const y = rowsTop + (pitch * ROWS * (i + 0.5)) / work.length;
    return { p, x: workX + 22, y, in: [workX + 14, y] };
  });
  const cables = EDGES.map(([a, b]) => {
    let [s, t] = COL[a] <= COL[b] ? [a, b] : [b, a];
    if (COL[s] === COL[t] && ROW[s] > ROW[t]) [s, t] = [t, s];
    const A = boxes[s];
    const B = boxes[t];
    let d;
    if (COL[s] === COL[t]) {
      // inside a step: a short drop from box to box
      const x = A.x + 18;
      d = `M${f1(x)} ${f1(A.y + A.h)}L${f1(x)} ${f1(B.y)}`;
    } else {
      const [ox, oy] = A.out;
      const [ix, iy] = B.in;
      const k = Math.max(36, (ix - ox) * 0.5);
      d = `M${f1(ox)} ${f1(oy)}C${f1(ox + k)} ${f1(oy)} ${f1(ix - k)} ${f1(iy)} ${f1(ix)} ${f1(iy)}`;
    }
    return { id: `${a}-${b}`, from: s, to: t, d };
  });
  // skills into the work they were used in: down into the channel under the skill's row, along it to a
  // trunk in front of the work column, and into the project, with rounded corners and clear of every box
  const feeds = [];
  const trunk = workX - 26;
  const R = 12;
  NODES.forEach((n) => {
    n.work.forEach((pid) => {
      const it = items.find((x) => x.p.id === pid);
      if (!it) return;
      const [ox, oy] = boxes[n.id].out;
      const [ix, iy] = it.in;
      const cy = oy + pitch / 2;
      const dir = iy >= cy ? 1 : -1;
      const parts = [`M${f1(ox)} ${f1(oy)}`, `C${f1(ox + 22)} ${f1(oy)} ${f1(ox + 14)} ${f1(cy)} ${f1(ox + 38)} ${f1(cy)}`];
      if (Math.abs(iy - cy) < 2 * R) {
        parts.push(`L${f1(trunk - 30)} ${f1(cy)}`, `C${f1(trunk)} ${f1(cy)} ${f1(trunk)} ${f1(iy)} ${f1(trunk + 30)} ${f1(iy)}`);
      } else {
        parts.push(`L${f1(trunk - R)} ${f1(cy)}`, `Q${f1(trunk)} ${f1(cy)} ${f1(trunk)} ${f1(cy + dir * R)}`, `L${f1(trunk)} ${f1(iy - dir * R)}`, `Q${f1(trunk)} ${f1(iy)} ${f1(trunk + R)} ${f1(iy)}`);
      }
      parts.push(`L${f1(ix)} ${f1(iy)}`);
      feeds.push({ id: `${n.id}>${pid}`, from: n.id, to: pid, d: parts.join("") });
    });
  });
  return { fs, gut, x0, x1, colW, colX, workX, workW, top, rowsTop, rowsH: pitch * ROWS, readTop: H - readH, boxes, items, cables, feeds };
}

// when the pulse reaches each skill (shortest travel from the listening column) and each cable
function schedule(L, lens) {
  const at = Object.fromEntries(NODES.map((n) => [n.id, COL[n.id] === 0 ? 0 : Infinity]));
  for (let k = 0; k < NODES.length; k += 1) {
    L.cables.forEach((c) => {
      const t = lens[c.id] / SPEED;
      if (at[c.from] + t < at[c.to]) at[c.to] = at[c.from] + t;
      if (at[c.to] + t < at[c.from]) at[c.from] = at[c.to] + t;
    });
  }
  const runs = [];
  L.cables.forEach((c) => {
    const rev = at[c.to] < at[c.from];
    runs.push({ id: c.id, start: Math.min(at[c.from], at[c.to]), dur: lens[c.id] / SPEED, rev });
  });
  const arrive = {};
  L.feeds.forEach((f) => {
    const dur = lens[f.id] / SPEED;
    runs.push({ id: f.id, start: at[f.from], dur, rev: false });
    arrive[f.to] = Math.min(arrive[f.to] ?? Infinity, at[f.from] + dur);
  });
  const end = Math.max(...runs.map((r) => r.start + r.dur));
  return { at, runs, arrive, period: end + 1.8 };
}

const Flow = ({ projects }) => {
  const state = useSkillState();
  const { active } = state;
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const pathRefs = useRef({});
  const pulseRefs = useRef({});
  const boxRefs = useRef({});
  const itemRefs = useRef({});
  const workLinkRefs = useRef({});
  const size = useSize(stageRef);
  const fonts = useFontsReady();
  const animate = useAnimate();
  const inView = useInView(sectionRef);
  const [col, setCol] = useState(null);
  const [hoverWork, setHoverWork] = useState(null);
  const [plan, setPlan] = useState(null);
  const activeRef = useRef(null);
  activeRef.current = active;
  const entered = useRef(false);

  const work = useMemo(() => [...projects].filter((p) => NODES.some((n) => n.work.includes(p.id))).sort(byRank), [projects]);
  const L = useMemo(() => (fonts && size && size.w > 600 ? layout(size.w, size.h, work) : null), [fonts, size, work]);

  // cable lengths, once drawn, give the pulse its timing
  useEffect(() => {
    if (!L) return;
    const lens = {};
    [...L.cables, ...L.feeds].forEach((c) => {
      const el = pathRefs.current[c.id];
      lens[c.id] = el ? el.getTotalLength() : 100;
    });
    setPlan({ ...schedule(L, lens), lens });
  }, [L]);

  // entrance: columns rise in order, then the cables draw from left to right
  useEffect(() => {
    if (!plan || entered.current) return;
    entered.current = true;
    if (!canAnimate()) return;
    const ctx = gsap.context(() => {
      gsap.from(".flw-band > *", { opacity: 0, y: 14, duration: 0.7, stagger: 0.08, ease: "power3.out" });
      gsap.from(".flw-head", { opacity: 0, y: 8, duration: 0.5, stagger: 0.07, delay: 0.15, ease: "power3.out" });
      gsap.from(".flw-rule", { scaleY: 0, transformOrigin: "50% 0%", duration: 0.7, stagger: 0.07, delay: 0.15, ease: "power3.inOut" });
      NODES.forEach((n) => {
        const el = boxRefs.current[n.id];
        if (el) gsap.from(el, { opacity: 0, x: -10, duration: 0.5, delay: 0.3 + COL[n.id] * 0.12 + ROW[n.id] * 0.04, ease: "power3.out" });
      });
      plan.runs.forEach((r) => {
        const el = pathRefs.current[r.id];
        if (!el || r.id.includes(">")) return;
        const len = plan.lens[r.id];
        gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: r.rev ? -len : len }, { strokeDashoffset: 0, duration: Math.max(0.25, r.dur), delay: 0.55 + r.start, ease: "none", clearProps: "strokeDasharray,strokeDashoffset" });
      });
      gsap.from(".flw-item", { opacity: 0, x: -8, duration: 0.5, stagger: 0.05, delay: 0.9, ease: "power3.out" });
      gsap.from(".flw-read", { opacity: 0, duration: 0.6, delay: 0.8 });
    }, sectionRef);
    return () => ctx.revert(); // eslint-disable-line consistent-return
  }, [plan]);

  // the pulse: on screen, motion on
  useEffect(() => {
    if (!plan || !animate || !inView) return undefined;
    let raf;
    const t0 = performance.now() + (entered.current ? 900 : 0);
    let lastT = -1;
    let lastActive = null;
    let activeT0 = 0;
    const flash = (el) => el && el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], { duration: 900, easing: "ease-out" });
    const D = 28;
    const place = (id, p, rev, on) => {
      const el = pulseRefs.current[id];
      if (!el) return;
      const len = plan.lens[id];
      if (!on || p < 0 || p > 1) {
        el.style.opacity = "0";
        return;
      }
      el.style.opacity = "1";
      el.setAttribute("stroke-dasharray", `${D} ${len + D}`);
      el.setAttribute("stroke-dashoffset", `${D - (rev ? 1 - p : p) * (len + D)}`);
    };
    const frame = (now) => {
      if (now < t0 || document.hidden) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const act = activeRef.current;
      if (act !== lastActive) {
        lastActive = act;
        activeT0 = now;
      }
      if (act) {
        // the picked skill sends its pulse along its own cables, over and over
        const t = ((now - activeT0) / 1000) % 1.8;
        plan.runs.forEach((r) => {
          const c = [...L.cables, ...L.feeds].find((x) => x.id === r.id);
          const mine = c.from === act || c.to === act;
          const rev = c.to === act; // always away from the picked skill
          place(r.id, (t - 0.1) / Math.max(0.35, r.dur), rev, mine);
        });
      } else {
        const t = ((now - t0) / 1000) % plan.period;
        plan.runs.forEach((r) => place(r.id, (t - r.start) / r.dur, r.rev, true));
        // a skill or a project lights as the pulse reaches it
        if (t < lastT) lastT = -1;
        NODES.forEach((n) => {
          const a = plan.at[n.id];
          if (a > lastT && a <= t) flash(boxRefs.current[n.id]?.querySelector(".flw-flash"));
        });
        Object.entries(plan.arrive).forEach(([pid, a]) => {
          if (a > lastT && a <= t) flash(itemRefs.current[pid]?.querySelector(".flw-flash"));
        });
        lastT = t;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      Object.values(pulseRefs.current).forEach((el) => {
        if (el) el.style.opacity = "0";
      });
    };
  }, [plan, animate, inView]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerMove = (e) => {
    if (!L) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const c = x < L.x0 || x > L.workX ? null : Math.min(4, Math.floor((x - L.x0) / L.colW));
    if (c !== col) setCol(c);
  };
  const onLeave = () => {
    setCol(null);
    setHoverWork(null);
    state.leave();
  };

  const lit = active ? new Set(neighbours(active)) : null;
  // a project under the pointer lights the skills it used
  const workSkills = hoverWork ? new Set(NODES.filter((n) => n.work.includes(hoverWork)).map((n) => n.id)) : null;
  const shownStep = active ? STEPS.indexOf(stepOf(active)) : col ?? 0;
  const moveFocus = (id, by) => {
    const next = ORDER[(ORDER.indexOf(id) + by + ORDER.length) % ORDER.length];
    boxRefs.current[next]?.focus();
  };
  const activeWork = active ? new Set(nodeOf(active).work) : null;

  return (
    <section ref={sectionRef} id="map" aria-labelledby="map-title" className="relative scroll-mt-16 bg-bone" onKeyDown={heroKeys(state)}>
      <style>{`
        .flw-box { transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease, opacity 200ms ease; }
        .flw-cable { transition: opacity 220ms ease, stroke 220ms ease; }
        .flw-in > * { animation: flw-in 240ms cubic-bezier(0.23, 1, 0.32, 1) both; }
        @keyframes flw-in { from { opacity: 0; transform: translateY(6px); } }
        @media (hover: hover) and (pointer: fine) { .flw-box:hover { border-color: rgb(var(--olive)); } }
      `}</style>
      <h2 id="map-title" className="sr-only">
        Skill map
      </h2>

      <div className="hidden h-[calc(100svh-65px)] min-h-[640px] flex-col map:flex">
        <div className="flw-band fu-gutter grid grid-cols-12 items-end gap-x-8 pt-10">
          <Statement active={active} state={state} className="fu-display col-span-9 leading-[1.06]" style={{ fontSize: "clamp(30px, 4.6vh, 46px)" }} />
          <p className="col-span-3 justify-self-end whitespace-nowrap pb-[0.35em] text-right font-mono text-[14px] leading-relaxed text-graphite">{AVAILABLE}</p>
        </div>

        <div ref={stageRef} className="relative mt-6 min-h-0 flex-1" onPointerMove={onPointerMove} onPointerLeave={onLeave}>
          {L && (
            <>
              {/* the columns: one per step, and the work they end in */}
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const x = i < 5 ? L.colX(i) : L.workX;
                const on = i < 5 && (col === i || shownStep === i);
                return (
                  <React.Fragment key={i}>
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute transition-colors duration-200"
                      style={{ left: x, top: L.top - 8, width: i < 5 ? L.colW : L.workW, height: L.readTop - L.top - 4, background: col === i && !active ? "rgb(var(--ink) / 0.035)" : "transparent" }}
                    />
                    <div aria-hidden="true" className="flw-rule pointer-events-none absolute w-px" style={{ left: x, top: 0, height: L.readTop - 12, background: `rgb(var(--ink) / ${i === 5 ? 0.5 : 0.16})` }} />
                    <p
                      aria-hidden="true"
                      className="flw-head absolute font-mono text-[13px] leading-none transition-colors duration-200"
                      style={{ left: x + 18, top: 8, color: i === 5 ? "rgb(var(--ink))" : on ? "rgb(var(--olive))" : "rgb(var(--graphite))", fontWeight: on || i === 5 ? 700 : 500 }}
                    >
                      {i < 5 ? STEPS[i].verb : "work"}
                    </p>
                  </React.Fragment>
                );
              })}

              <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" fill="none">
                {[...L.cables, ...L.feeds].map((c) => {
                  const feed = c.id.includes(">");
                  const mine = active && (c.from === active || c.to === active);
                  const toWork = hoverWork && feed && c.to === hoverWork;
                  const hot = mine || toWork;
                  const base = feed ? (hot ? 1 : 0) : active || hoverWork ? (hot ? 1 : 0.18) : 0.6;
                  return (
                    <g key={c.id}>
                      <path
                        ref={(el) => {
                          pathRefs.current[c.id] = el;
                        }}
                        className="flw-cable"
                        d={c.d}
                        style={{ stroke: hot ? "rgb(var(--olive))" : "rgb(var(--ink))", opacity: base }}
                        strokeWidth={hot ? 2 : 1.25}
                      />
                      {animate && (
                        <path
                          ref={(el) => {
                            pulseRefs.current[c.id] = el;
                          }}
                          d={c.d}
                          style={{ stroke: "rgb(var(--olive))", opacity: 0 }}
                          strokeWidth={feed ? 2 : 3}
                          strokeLinecap="round"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* the skills, in reading order */}
              <div role="group" aria-label="Skills along the method, from listen to play. Select one for its tools and projects.">
                {ORDER.map((id) => {
                  const b = L.boxes[id];
                  const isActive = active === id;
                  const isLit = (lit && lit.has(id)) || (workSkills && workSkills.has(id));
                  const quiet = (active && !isActive && !(lit && lit.has(id))) || (hoverWork && !workSkills.has(id));
                  const d = dotD(id);
                  return (
                    <button
                      key={id}
                      ref={(el) => {
                        boxRefs.current[id] = el;
                      }}
                      type="button"
                      data-skill={id}
                      aria-pressed={state.pinned === id}
                      aria-label={skillAria(id, projects)}
                      className="flw-box absolute flex items-center gap-2.5 border font-medium leading-none"
                      style={{
                        left: b.x,
                        width: b.w,
                        paddingInline: b.pad,
                        top: b.y,
                        height: b.h,
                        whiteSpace: "nowrap",
                        fontSize: L.fs,
                        background: isActive ? "rgb(var(--olive-fill))" : isLit ? "rgb(var(--paper))" : "rgb(var(--bone))",
                        borderColor: isActive ? "rgb(var(--olive-fill))" : "rgb(var(--ink))",
                        color: isActive ? "#fff" : "rgb(var(--ink))",
                        opacity: quiet ? 0.45 : 1,
                        borderWidth: isLit ? 1.5 : 1,
                      }}
                      onPointerEnter={() => state.enter(id)}
                      onPointerLeave={() => state.cancel()}
                      onFocus={() => state.show(id)}
                      onClick={() => state.toggle(id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          state.pin(id);
                          const first = nodeOf(id).work.map((pid) => workLinkRefs.current[pid]).find(Boolean);
                          setTimeout(() => first?.focus(), 0);
                        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                          e.preventDefault();
                          moveFocus(id, 1);
                        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                          e.preventDefault();
                          moveFocus(id, -1);
                        }
                      }}
                    >
                      {/* inlet and outlet, as on a patch object */}
                      <span aria-hidden="true" className="absolute -left-[4px] top-1/2 h-[7px] w-[7px] -translate-y-1/2" style={{ background: isActive ? "rgb(var(--olive-fill))" : "rgb(var(--ink))" }} />
                      <span aria-hidden="true" className="absolute -right-[4px] top-1/2 h-[7px] w-[7px] -translate-y-1/2" style={{ background: isActive ? "rgb(var(--olive-fill))" : "rgb(var(--ink))" }} />
                      <span aria-hidden="true" className="skill-dot inline-block shrink-0 rounded-full border-[1.5px]" style={{ width: d, height: d, borderColor: isActive ? "#fff" : "rgb(var(--ink))", background: isActive ? "#fff" : "transparent" }} />
                      {labelOf(id)}
                      <span aria-hidden="true" className="flw-flash pointer-events-none absolute -inset-[3px] border-2 opacity-0" style={{ borderColor: "rgb(var(--olive))" }} />
                    </button>
                  );
                })}
              </div>

              {/* the work, where the cables end */}
              <ul aria-label="Selected work">
                {L.items.map(({ p, x, y }) => {
                  const on = (activeWork && activeWork.has(p.id)) || hoverWork === p.id;
                  const quiet = (active && !activeWork.has(p.id)) || (hoverWork && hoverWork !== p.id);
                  return (
                    <li
                      key={p.id}
                      ref={(el) => {
                        itemRefs.current[p.id] = el;
                      }}
                      className="flw-item absolute -translate-y-1/2"
                      style={{ left: x - 22, top: y }}
                    >
                      <Link
                        href={`/projects/${p.id}`}
                        ref={(el) => {
                          workLinkRefs.current[p.id] = el;
                        }}
                        onPointerEnter={() => setHoverWork(p.id)}
                        onPointerLeave={() => setHoverWork(null)}
                        onFocus={() => setHoverWork(p.id)}
                        onBlur={() => setHoverWork(null)}
                        className="group relative flex min-h-[32px] items-center gap-3 pl-[10px] font-semibold transition-opacity duration-200"
                        style={{ fontSize: L.fs, opacity: quiet ? 0.4 : 1 }}
                      >
                        <span aria-hidden="true" className="relative inline-block h-[7px] w-[7px] shrink-0" style={{ background: on ? "rgb(var(--olive))" : "rgb(var(--ink))" }}>
                          <span className="flw-flash absolute -inset-[4px] border-2 opacity-0" style={{ borderColor: "rgb(var(--olive))" }} />
                        </span>
                        <span className={`underline-offset-4 group-hover:underline ${on ? "text-olive" : ""}`}>{mapTitle(p)}</span>
                        <span aria-hidden="true" className="text-olive">
                          ↗
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* the readout: the step under the pointer, or the picked skill */}
              <div className="flw-read absolute border-t border-ink pt-4" style={{ left: L.x0, right: size.w - L.x1, top: L.readTop, height: size.h - L.readTop }}>
                <div key={active || `s${shownStep}`} className="flw-in grid grid-cols-12 gap-x-8">
                  {active ? (
                    <>
                      <div className="col-span-3 flex flex-col gap-2">
                        <p className="font-mono text-[13px] leading-none text-olive">{stepOf(active).verb}</p>
                        <p className="text-[24px] font-semibold leading-[1.05] tracking-[-0.015em]">{labelOf(active)}</p>
                      </div>
                      <div className="col-span-9 flex max-w-[760px] flex-col gap-2">
                        <SkillCardBody id={active} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-3 flex flex-col gap-2">
                        <p className="font-mono text-[13px] leading-none text-olive">{STEPS[shownStep].verb}</p>
                        <p className="text-[24px] font-semibold leading-[1.05] tracking-[-0.015em]">{STEPS[shownStep].skills.map(labelOf).join(", ")}</p>
                      </div>
                      <p className="col-span-9 max-w-[760px] text-[16px] leading-snug">{STEPS[shownStep].items}</p>
                    </>
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

      <FlowPhone projects={projects} state={state} />
    </section>
  );
};

// the readout's text for a skill: what it is and its tools (its projects are lit in the work column)
const SkillCardBody = ({ id }) => {
  const n = nodeOf(id);
  return (
    <>
      <p className="text-[16px] leading-snug">{SKILL_NOTES[id]}</p>
      <p className="font-mono text-[13px] leading-snug text-graphite">{n.tools.join(", ")}</p>
    </>
  );
};

// Phones and tablets: the method as five ruled rows read top to bottom, the skills of each step as
// buttons; the picked skill opens its card, with its projects, under the rows.
const FlowPhone = ({ projects, state }) => {
  const { active } = state;
  const animate = useAnimate();
  return (
    <div className="px-4 pb-14 pt-12 fu-gutter tablet:pb-20 tablet:pt-16 map:hidden">
      <div className="flex max-w-[720px] flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Statement active={active} state={state} className="text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] tablet:text-[48px]" />
          <p className="font-mono text-[13px] text-graphite">{AVAILABLE}</p>
        </div>
        <ol className="relative flex flex-col" aria-label="The method, from listen to play">
          {/* the pulse runs down the rows */}
          <span aria-hidden="true" className="absolute bottom-0 left-[5px] top-0 w-px bg-ink/25" />
          {animate && (
            <span aria-hidden="true" className="absolute bottom-0 left-[4px] top-0 w-[3px] overflow-hidden">
              <span className="flw-drop absolute inset-0" style={{ background: "linear-gradient(to bottom, rgb(var(--olive)) 0, rgb(var(--olive)) 40px, transparent 40px)" }} />
            </span>
          )}
          {STEPS.map((s) => (
            <li key={s.id} className="relative grid grid-cols-[72px_1fr] items-start gap-3 border-t border-ink/20 py-3 pl-5 first:border-t-0">
              <span aria-hidden="true" className="absolute left-[2px] top-[22px] h-[7px] w-[7px] bg-ink" />
              <span className="pt-[11px] font-mono text-[13px] leading-none text-olive">{s.verb}</span>
              <span className="flex flex-wrap gap-2">
                {[...s.skills].sort((a, b) => ROW[a] - ROW[b]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active === id}
                    onClick={() => state.toggle(id)}
                    className="flex min-h-[40px] items-center gap-2 border px-3 text-[15px] font-medium"
                    style={{ background: active === id ? "rgb(var(--olive-fill))" : "rgb(var(--bone))", color: active === id ? "#fff" : "rgb(var(--ink))", borderColor: active === id ? "rgb(var(--olive-fill))" : "rgb(var(--ink))" }}
                  >
                    <span aria-hidden="true" className="inline-block rounded-full border-[1.5px]" style={{ width: dotD(id) - 2, height: dotD(id) - 2, borderColor: "currentColor" }} />
                    {labelOf(id)}
                  </button>
                ))}
              </span>
            </li>
          ))}
        </ol>
        <div aria-live="polite">
          {active ? (
            <div key={active} className="flw-in border-t border-ink pt-4">
              <SkillCard id={active} projects={projects} compact />
            </div>
          ) : (
            <a href="#work" className="inline-flex min-h-[44px] w-max items-center border-b-2 border-olive font-mono text-[14px] text-olive">
              All work
            </a>
          )}
        </div>
      </div>
      <style>{`
        .flw-drop { animation: flw-drop 4.2s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
        @keyframes flw-drop { 0% { transform: translateY(0); opacity: 0; } 8% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateY(calc(100% - 40px)); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default Flow;
