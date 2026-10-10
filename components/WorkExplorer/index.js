import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { NODES, RING, CLUSTERS, labelOf, skillsOfProject } from "../Graph/data";
import Sigil from "../Sigil";
import { categoryMeta, withBase, useIsomorphicLayoutEffect, usePrefersReducedMotion } from "../../utils";
import { relaxRects, textWidth } from "../../utils/layout";
import { scramble, drawIn, motionOn } from "../../utils/motion";
import portfolioData from "../../data/portfolio.json";


const HALO = { paintOrder: "stroke", stroke: "rgb(var(--bone))", strokeWidth: 6, strokeLinejoin: "round" };
const skillIds = (id) => skillsOfProject(id).map((n) => n.id);
// A project dates from its first publication, not from a later rework ("2024 · reworked 2026" is 2024).
const yearOf = (p) => ((p.dateLabel || "").match(/\d{4}/) || [(p.date || "").slice(0, 4)])[0];
const newestFirst = (a, b) => yearOf(b).localeCompare(yearOf(a)) || (b.date || "").localeCompare(a.date || "");
// Curated order (`rank` in portfolio.json): applied UX research and design first, then academic and
// data work, then creative coding and live work. Projects without a rank follow, newest first.
const curated = (a, b) => (a.rank ?? 99) - (b.rank ?? 99) || newestFirst(a, b);
const shortTitle = (t) => t.split(" - ")[0];
const mapTitle = (p) => p.short || shortTitle(p.title);
const VIEWS = ["Grid", "Wheel"];
// a plain key press inside this section, not typing in a field and not a browser shortcut
const plainKey = (e) => !(e.metaKey || e.ctrlKey || e.altKey) && !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);



// ——— wheel: projects pulled towards the skills they use (RadViz) ———
const Wh = { W: 1376, H: 1040, CX: 520, CY: 500, R: 360 };
const angleOf = (id) => -Math.PI / 2 + (2 * Math.PI * RING.indexOf(id)) / RING.length;
const anchorOf = (id) => [Wh.CX + Wh.R * Math.cos(angleOf(id)), Wh.CY + Wh.R * Math.sin(angleOf(id))];
const CLUSTER_TEXT = CLUSTERS.map((c) => {
  const am = c.skills.reduce((a, k) => a + angleOf(k), 0) / c.skills.length;
  const cos = Math.cos(am);
  const anchor = cos > 0.3 ? "end" : cos < -0.3 ? "start" : "middle";
  const x = Wh.CX + (Wh.R - 30) * cos;
  const y = Wh.CY + (Wh.R - 40) * Math.sin(am) + (Math.sin(am) < 0 ? 8 : 0);
  const w = c.label.length * 14.5;
  const left = anchor === "end" ? x - w : anchor === "start" ? x : x - w / 2;
  return { ...c, x, y, anchor, box: [left, y - 26, left + w, y + 8], arc: [angleOf(c.skills[0]) - 0.15, angleOf(c.skills[c.skills.length - 1]) + 0.15] };
});

function wheelLayout(projects) {
  const items = {};
  projects.forEach((p) => {
    const s = skillIds(p.id);
    const x = s.reduce((a, k) => a + anchorOf(k)[0], 0) / s.length;
    const y = s.reduce((a, k) => a + anchorOf(k)[1], 0) / s.length;
    const w = textWidth(mapTitle(p), 16) * 1.1 + 18;
    items[p.id] = [Wh.CX + (x - Wh.CX) * 0.78, Wh.CY + (y - Wh.CY) * 0.78, -Math.max(16, w / 2), -16, Math.max(16, w / 2), 16];
  });
  const inner = Wh.R * 0.78;
  return relaxRects(items, { fixed: CLUSTER_TEXT.map((c) => c.box), box: [Wh.CX - inner, Wh.CY - inner, Wh.CX + inner, Wh.CY + inner], pad: 7 });
}

// stillOnly: the grid always shows the still; the wheel card plays the loop unless motion is off
const Media = ({ project, className = "", stillOnly = false }) => {
  const reduced = usePrefersReducedMotion() || !motionOn();
  const motion = project.tileMotion && !reduced && !stillOnly ? project.tileMotion : null;
  const still = project.cardWebp || project.cardImage || project.imageSrc;
  const src = motion || still;
  if (motion && motion.endsWith(".mp4")) {
    return <video src={withBase(motion)} poster={withBase(still)} className={className} autoPlay muted loop playsInline aria-label={project.title} />;
  }
  if (src) return <img src={withBase(src)} alt="" className={className} loading="lazy" draggable={false} />;
  return (
    <div className={`bg-khaki ${className}`} />
  );
};

// who made it, at a glance: solo, or the team size
const teamOf = (p) => {
  if (!Array.isArray(p.collaborators)) return null;
  if (!p.collaborators.length) return "Solo";
  return `Team of ${p.collaborators.length + 1}`;
};

// Selected work as an index of works: each title at display size between ink rules. On wide screens the
// row under the pointer or keyboard focus shows its image in a sticky preview beside the list.
const IndexList = ({ projects }) => {
  const [active, setActive] = useState(projects[0]?.id);
  const current = projects.find((p) => p.id === active) || projects[0];
  return (
    <div className="grid gap-x-10 laptop:grid-cols-12">
      <ol className="border-b border-ink/15 laptop:col-span-7">
        {projects.map((p) => {
          const on = current && p.id === current.id;
          return (
            <li key={p.id} className="border-t border-ink/15 first:border-ink">
              <Link
                href={`/projects/${p.id}`}
                onMouseEnter={() => setActive(p.id)}
                onFocus={() => setActive(p.id)}
                className="group grid gap-x-6 gap-y-2 py-5 laptop:grid-cols-[1fr_auto] laptop:py-6"
              >
                <div className="mb-2 aspect-[4/3] overflow-hidden border border-ink laptop:hidden">
                  <Media project={p} stillOnly className="h-full w-full object-cover" />
                </div>
                <h3 className={`index-title fu-display text-[34px] leading-[1.04] tablet:text-phi2 group-hover:text-olive ${on ? "is-on laptop:text-olive" : ""}`}>
                  {shortTitle(p.title)}
                </h3>
                <span className="font-mono text-[14px] leading-relaxed text-graphite laptop:row-span-2 laptop:pt-2 laptop:text-right">
                  {categoryMeta(p.category).short} · {yearOf(p)}
                  {teamOf(p) && <span className="block">{teamOf(p)}</span>}
                </span>
                <p className="max-w-[60ch] text-[18px] leading-snug text-ink/80">{p.description}</p>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="hidden laptop:col-span-5 laptop:block" aria-hidden="true">
        <div className="sticky top-24">
          <div className="relative aspect-[4/3] overflow-hidden border border-ink bg-paper">
            {projects.map((p, i) => {
              const at = projects.indexOf(current);
              // above the current row: rolled away upwards; below it: waiting underneath
              const clip = i === at ? "inset(0 0 0 0)" : i < at ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)";
              return (
                <div key={p.id} className="index-shot absolute inset-0" style={{ clipPath: clip, zIndex: i === at ? 2 : 1 }}>
                  <Media project={p} stillOnly className="h-full w-full object-cover" />
                </div>
              );
            })}
          </div>
          {current && <p className="mt-3 font-mono text-[14px] leading-relaxed text-graphite">{skillIds(current.id).map(labelOf).join(", ")}</p>}
        </div>
      </div>
    </div>
  );
};

// the card beside the wheel
const ProjectCard = ({ project, skills = true }) => (
  <div className="work-side flex flex-col border border-ink bg-paper text-[16px] leading-snug shadow-[6px_6px_0_rgb(var(--olive))]">
    <Media project={project} className="aspect-[4/3] w-full border-b border-ink object-cover" />
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center justify-between font-mono text-[14px]">
        <span className="text-olive">
          {categoryMeta(project.category).short.toUpperCase()} · {yearOf(project)}
        </span>
        {teamOf(project) && <span className="text-graphite">{teamOf(project)}</span>}
      </div>
      <span className="text-[22px] font-bold leading-tight">{shortTitle(project.title)}</span>
      <span>{project.description}</span>
      {skills && <span className="font-mono text-[14px] leading-relaxed text-graphite">{skillIds(project.id).map(labelOf).join(", ")}</span>}
      <Link href={`/projects/${project.id}`} className="font-semibold text-olive underline underline-offset-2 hover:text-ink">
        View project →
      </Link>
    </div>
  </div>
);

const Uses = ({ project, row = false, children }) => (
  <figure className={`flex gap-4 border border-ink bg-paper p-4 ${row ? "flex-row items-start" : "flex-col"}`}>
    {row ? <div className="w-[180px] shrink-0">{children}</div> : children}
    <dl className={`grid flex-1 gap-x-3 text-[16px] leading-snug ${row ? "grid-cols-1 gap-y-1 [&>dd]:mb-2" : "grid-cols-[112px_1fr] gap-y-2"}`}>
      <dt className="font-mono text-[14px] uppercase text-olive">Disciplines</dt>
      <dd>{skillIds(project.id).map(labelOf).join(", ")}</dd>
      {project.summary?.stack && (
        <>
          <dt className="font-mono text-[14px] uppercase text-olive">Technologies</dt>
          <dd>{project.summary.stack}</dd>
        </>
      )}
    </dl>
  </figure>
);


const Select = ({ label, value, onChange, options }) => (
  <label className="flex min-w-[150px] flex-1 flex-col gap-1 font-mono text-[14px] text-graphite desktop:flex-none">
    {label}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[44px] w-full min-w-[160px] cursor-pointer border border-ink bg-paper px-2.5 font-mono text-[14px] text-ink"
    >
      {options.map(([v, t]) => (
        <option key={v} value={v}>
          {t}
        </option>
      ))}
    </select>
  </label>
);

const WorkExplorer = ({ projects: given }) => {
  const projects = useMemo(() => [...given].sort(curated), [given]);
  const [view, setView] = useState("Grid");
  const [skill, setSkill] = useState("all");
  const [type, setType] = useState("all");
  const [year, setYear] = useState("all");
  const [picked, setPicked] = useState(null);
  const [hot, setHot] = useState(null);
  const rootRef = useRef(null);

  const years = [...new Set(projects.map(yearOf))].sort().reverse();
  const matches = (p) => (skill === "all" || skillIds(p.id).includes(skill)) && (type === "all" ? p.category !== "Live Coding" : p.category === type) && (year === "all" || yearOf(p) === year);
  const shown = projects.filter(matches);
  // the index of works is the default; `?work=cards` still shows the earlier card grid
  const [layout, setLayout] = useState("index");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("work") === "cards") setLayout("cards");
  }, []);
  const selected = shown.find((p) => p.id === picked) || shown[0] || projects[0];
  const wheel = useMemo(() => wheelLayout(projects), [projects]);
  const filtered = skill !== "all" || year !== "all";

  // each view makes its entrance when it is switched to
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!motionOn()) return;
      const q = (s) => Array.from(root.querySelectorAll(s));
      if (view === "Grid") {
        if (q(".work-card").length) gsap.from(q(".work-card"), { y: 40, opacity: 0, duration: 0.8, stagger: 0.05, ease: "power3.out", clearProps: "transform,opacity" });
      }
      if (view === "Wheel") {
        drawIn(gsap, q(".wheel-ring"), { duration: 1.2 });
        gsap.from(q(".wheel-anchor"), { scale: 0, transformOrigin: "50% 50%", duration: 0.4, stagger: 0.03, ease: "back.out(2)", delay: 0.3 });
        q(".wheel-pt").forEach((el, i) =>
          gsap.from(el, { x: Wh.CX - Number(el.dataset.x), y: Wh.CY - Number(el.dataset.y), opacity: 0, duration: 1.1, delay: 0.5 + i * 0.04, ease: "expo.out" })
        );
        q(".wheel-cluster").forEach((el, i) => scramble(gsap, el, 0.4 + i * 0.12));
      }
      if (view !== "Grid" && q(".work-side").length) gsap.from(q(".work-side"), { x: 50, opacity: 0, duration: 0.8, delay: 0.5, ease: "power3.out" });
    });
    return () => mm.revert();
  }, [view]);

  // spokes from the picked project to its skills draw in on every pick
  useIsomorphicLayoutEffect(() => {
    if (view !== "Wheel") return undefined;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => motionOn() && drawIn(gsap, Array.from(rootRef.current.querySelectorAll(".wheel-spoke")), { step: 0.08, duration: 0.5 }));
    return () => mm.revert();
  }, [selected.id, view]);

  const plotRef = useRef(null);
  const [plotW, setPlotW] = useState(null);
  const [winH, setWinH] = useState(900);
  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      if (plotRef.current) setPlotW(plotRef.current.clientWidth - 400 - 40);
      setWinH(window.innerHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [view]);
  // the wheel at a little under the full width beside its card
  const FIT = 0.88;
  const WW = Wh.CX * 2 + 40;
  const ws = plotW ? Math.min(1.2, (plotW / WW) * FIT) : 0.8;

  const [chipW, setChipW] = useState({});
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const measure = () => {
      const w = {};
      root.querySelectorAll("text[data-chip]").forEach((t) => {
        w[t.dataset.chip] = t.getComputedTextLength();
      });
      setChipW((prev) => (JSON.stringify(prev) === JSON.stringify(w) ? prev : w));
    };
    measure();
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    return undefined;
  }, [view, selected.id]);
  const widthOf = (key, text, px) => chipW[key] || textWidth(text, px) * 1.05;


  const pointProps = (p) => ({
    tabIndex: matches(p) ? 0 : -1,
    role: "button",
    "aria-pressed": selected.id === p.id,
    "aria-label": `${mapTitle(p)}, ${categoryMeta(p.category).short}, ${yearOf(p)}`,
    onClick: () => {
      if (!matches(p)) return;
      setPicked(p.id);
    },
    onMouseEnter: () => matches(p) && setHot(p.id),
    onMouseLeave: () => setHot(null),
    onFocus: () => setHot(p.id),
    onBlur: () => setHot(null),
    onKeyDown: (e) => {
      if (e.key === " ") {
        e.preventDefault();
        setPicked(p.id);
        }
      if (e.key === "Enter") window.location.assign(withBase(`/projects/${p.id}/`));
    },
    style: { cursor: matches(p) ? "pointer" : "default", opacity: matches(p) ? 1 : 0.15, transition: "opacity .3s" },
  });

  return (
    <section
      id="work"
      aria-labelledby="work-title"
      ref={rootRef}
      className="scroll-mt-16 border-t border-ink px-4 py-16 fu-gutter tablet:py-24"
      onKeyDown={(e) => {
        if (!plainKey(e)) return;
        if (/^[igIG]$/.test(e.key)) setView("Grid");
        if ((e.key === "w" || e.key === "W") && window.matchMedia("(min-width: 1280px)").matches) setView("Wheel");
      }}
    >
      <div className="flex flex-col gap-6 pb-12 desktop:flex-row desktop:items-end desktop:justify-between">
        <div className="fu-reveal flex flex-col gap-2">
          <h2 id="work-title" className="fu-section-title">Selected work</h2>
        </div>
        <div className="flex w-full flex-wrap items-end gap-3 desktop:w-auto">
          {/* design and research together; live coding on its own */}
          <div className="flex flex-col gap-1 font-mono text-[14px] text-graphite">
            Show
            <div className="flex" role="group" aria-label="Show">
              {[
                ["all", "Projects"],
                ["Live Coding", "Live coding"],
              ].map(([v, t]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={type === v}
                  onClick={() => setType(v)}
                  className={`-mr-px min-h-[44px] border border-ink px-4 font-mono text-[14px] transition-colors ${type === v ? "bg-ink text-bone" : "bg-paper text-ink hover:bg-bone"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Select label="Year" value={year} onChange={setYear} options={[["all", "All years"], ...years.map((y) => [y, y])]} />
          <div className="hidden flex-col gap-1 font-mono text-[14px] text-graphite desktop:flex">
            View
            <div className="flex" role="group" aria-label="View">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`-mr-px min-h-[44px] border border-ink px-4 font-mono text-[14px] transition-colors ${view === v ? "bg-olive text-white" : "bg-paper text-ink hover:bg-bone"}`}
                >
                  {v === "Grid" ? "Index" : v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ——— grid (always on smaller screens) ——— */}
      <div className={view === "Grid" ? "" : "desktop:hidden"}>
        {shown.length && layout === "index" ? (
          <IndexList projects={shown} />
        ) : shown.length ? (
          <ul className="work-grid grid gap-5 tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-4">
            {shown.map((p) => (
              <li key={p.id} className="work-card">
                <Link href={`/projects/${p.id}`} className="flex h-full flex-col border border-ink bg-paper">
                  <div className="aspect-[4/3] overflow-hidden border-b border-ink">
                    <Media project={p} stillOnly className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-grow flex-col gap-1.5 px-3.5 pb-3.5 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 font-mono text-[14px]">
                      <span className="whitespace-nowrap text-olive">
                        {categoryMeta(p.category).short.toUpperCase()} · {yearOf(p)}
                      </span>
                      {teamOf(p) && <span className="whitespace-nowrap text-graphite">{teamOf(p)}</span>}
                    </div>
                    <h3 className="text-[18px] font-bold leading-tight">{shortTitle(p.title)}</h3>
                    <p className="text-[16px] leading-snug text-ink/85">{p.description}</p>
                    <p className="mt-auto pt-1.5 font-mono text-[14px] leading-relaxed text-graphite">{skillIds(p.id).map(labelOf).join(", ")}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-10 text-[16px]">
            Nothing matches those filters.{" "}
            <button
              type="button"
              className="font-semibold text-olive underline"
              onClick={() => {
                setSkill("all");
                setType("all");
                setYear("all");
              }}
            >
              Clear filters
            </button>
          </p>
        )}
      </div>

      {/* ——— wheel ——— */}
      {view === "Wheel" && (
        <div ref={plotRef} className="hidden items-start gap-10 desktop:flex">
            <svg viewBox={`0 0 ${WW} ${Wh.H}`} width={WW * ws} height={Wh.H * ws} className="shrink-0" role="group" aria-label="Work wheel: each project is pulled towards the skills it uses">
              <defs>
                <radialGradient id="work-glow">
                  <stop offset="0%" style={{ stopColor: "rgb(var(--olive))" }} stopOpacity="0.5" />
                  <stop offset="50%" style={{ stopColor: "rgb(var(--olive))" }} stopOpacity="0.18" />
                  <stop offset="100%" style={{ stopColor: "rgb(var(--olive))" }} stopOpacity="0" />
                </radialGradient>
              </defs>
              {CLUSTER_TEXT.map((c) => {
                const r = Wh.R - 12;
                const [a0, a1] = c.arc;
                return (
                  <g key={c.id} aria-hidden="true">
                    <path
                      d={`M ${Wh.CX + r * Math.cos(a0)} ${Wh.CY + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${Wh.CX + r * Math.cos(a1)} ${Wh.CY + r * Math.sin(a1)}`}
                      fill="none"
                      style={{ stroke: "rgb(var(--olive))" }}
                      strokeWidth="6"
                      opacity="0.16"
                    />
                    <text className="wheel-cluster" x={c.x} y={c.y} textAnchor={c.anchor} fontFamily="JetBrains Mono, monospace" fontSize="18" fontWeight="500" letterSpacing="0.16em" style={{ fill: "rgb(var(--olive))" }}>
                      {c.label.toUpperCase()}
                    </text>
                  </g>
                );
              })}
              {[0.33, 0.66].map((f) => (
                <circle key={f} cx={Wh.CX} cy={Wh.CY} r={Wh.R * f} fill="none" style={{ stroke: "rgb(var(--concrete))" }} strokeDasharray="1 5" aria-hidden="true" />
              ))}
              <circle className="wheel-ring" cx={Wh.CX} cy={Wh.CY} r={Wh.R} fill="none" style={{ stroke: "rgb(var(--ink))" }} strokeWidth="1.5" />
              {skillIds(selected.id).map((k) => (
                <line key={k} className="wheel-spoke" x1={wheel[selected.id][0]} y1={wheel[selected.id][1]} x2={anchorOf(k)[0]} y2={anchorOf(k)[1]} style={{ stroke: "rgb(var(--olive))" }} strokeWidth="2" aria-hidden="true" />
              ))}
              {RING.map((k) => {
                const [x, y] = anchorOf(k);
                const a = angleOf(k);
                const on = skillIds(selected.id).includes(k);
                const lx = Wh.CX + (Wh.R + 22) * Math.cos(a);
                const ly = Wh.CY + (Wh.R + 22) * Math.sin(a);
                const anchor = Math.abs(Math.cos(a)) < 0.25 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
                const dy = Math.sin(a) < -0.9 ? -4 : Math.sin(a) > 0.9 ? 14 : 5;
                return (
                  <g key={k} aria-hidden="true">
                    <circle className="wheel-anchor" cx={x} cy={y} r="7" style={{ fill: on ? "rgb(var(--olive))" : "rgb(var(--bone))", stroke: on ? "rgb(var(--olive))" : "rgb(var(--ink))" }} strokeWidth="1.5" />
                    <text x={lx} y={ly + dy} textAnchor={anchor} fontFamily="Inter Tight, sans-serif" fontSize="17" fontWeight={on ? 700 : 400} style={{ fill: on ? "rgb(var(--olive))" : "rgb(var(--ink))" }}>
                      {labelOf(k)}
                    </text>
                  </g>
                );
              })}
              {projects.map((p) => {
                const [x, y] = wheel[p.id];
                const on = selected.id === p.id;
                const col = on ? "rgb(var(--olive))" : "rgb(var(--ink))";
                return (
                  <g key={p.id} className="wheel-pt" data-x={x} data-y={y} {...pointProps(p)}>
                    {on && <circle className="work-glow glow-pulse" cx={x} cy={y} r="44" fill="url(#work-glow)" />}
                    {(() => {
                      const w = widthOf(`w${p.id}`, mapTitle(p), 16) + 16;
                      const top = y - 13;
                      return (
                        <rect x={x - w / 2} y={top} width={w} height="26" style={{ fill: on ? "rgb(var(--olive))" : hot === p.id ? "color-mix(in srgb, rgb(var(--olive)) 16%, #fff)" : "rgb(var(--paper))", stroke: on || hot === p.id ? "rgb(var(--olive))" : "rgb(var(--ink))", transition: "fill .2s" }} strokeWidth={hot === p.id && !on ? 2.5 : 1} />
                      );
                    })()}
                    <text data-chip={`w${p.id}`} x={x} y={y + 5} textAnchor="middle" fontFamily="Inter Tight, sans-serif" fontSize="16" fontWeight="500" style={{ fill: on ? "#fff" : hot === p.id ? "rgb(var(--olive))" : col, transition: "fill .2s" }}>
                      {mapTitle(p)}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="sticky top-20 flex min-w-[400px] flex-1 flex-col gap-5 self-start">
              <ProjectCard project={selected} skills={false} />
              <Uses project={selected} row>
                <Sigil skills={skillIds(selected.id)} size={180} width={2} />
              </Uses>
            </div>
        </div>
      )}

      {filtered && view !== "Grid" && (
        <p className="mt-4 hidden font-mono text-[14px] text-graphite desktop:block">
          Showing {shown.length} of {projects.length}; the rest are dimmed.
        </p>
      )}
    </section>
  );
};

export default WorkExplorer;
