import React, { useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import portfolioData from "../../data/portfolio.json";
import { useIsomorphicLayoutEffect, useMotionOn, withBase } from "../../utils";
import { textWidth } from "../../utils/layout";
import { MODELS, ModelSwitch, Spiral } from "./Perspectives";

// Timeline: studies, roles and projects on one axis. Large screens get the drawn
// timeline; smaller ones get the same content as a list by year.
const NOW = 2026.75;
// the axis starts where the layer's first item does: studies from 2018, roles from 2023
const START = { studies: 2018.5, roles: 2023.1 };
const T1 = 2027.1;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const W = 1200;
const PAD = 16;
const ROW = 34;
const BAR_ROW = 40;
const scale = (t0) => (t) => PAD + ((t - t0) / (T1 - t0)) * (W - PAD * 2);

const yearOf = (p) =>
  +((p.dateLabel || "").match(/\d{4}/) || [(p.date || "").slice(0, 4)])[0];
// a project sits at its first publication year, at the month of its date when that is the same year
const timeOf = (p) => {
  const y = yearOf(p);
  const [dy, dm] = (p.date || "").split("-").map(Number);
  return y + (dy === y && dm ? (dm - 1) / 12 : 0.5);
};
const shortTitle = (p) => p.short || p.title.split(" - ")[0];

// greedy rows: each item takes the first row where its span (bar or label) fits
function pack(items) {
  const rows = [];
  return items.map((it) => {
    let r = rows.findIndex((end) => end + 10 < it.x0);
    if (r < 0) {
      rows.push(0);
      r = rows.length - 1;
    }
    rows[r] = it.x1;
    return { ...it, row: r };
  });
}

// roles and studies: a thin bar for the span, its label always above it, from where the bar starts
// (or ending where it ends, when the label would run past "now")
function spans(px, list, getStart, getEnd, label) {
  return pack(
    list
      .map((e) => {
        const s = getStart(e);
        const end = getEnd(e) ?? NOW;
        const bx = px(s);
        const x1b = Math.max(px(end), bx + 6);
        const w = textWidth(label(e), 14) * 1.05;
        const flip = bx + w > px(NOW) - 6;
        const lx0 = flip ? Math.min(x1b, px(NOW) - 8) - w : bx;
        return { e, s, end, bx, x1b, flip, x0: Math.min(bx, lx0), x1: Math.max(x1b, lx0 + w) };
      })
      .sort((a, b) => a.s - b.s),
  );
}

const Journey = ({ projects }) => {
  const [layer, setLayer] = useState("roles"); // "roles" or "studies": one at a time, with the projects
  const [model, setModel] = useState("linear"); // how time is read: see ./Perspectives
  const { resume, journey } = portfolioData;
  const T0 = START[layer];
  const px = scale(T0);
  const motion = useMotionOn();
  const wrapRef = useRef(null);
  const headRef = useRef(null);
  const sweep = useRef({ t: NOW, T0, px, apply: null });
  Object.assign(sweep.current, { T0, px });
  const studies = spans(
    px,
    resume.educationList,
    (e) => e.start,
    (e) => e.end,
    (e) => e.short,
  );
  const roles = spans(
    px,
    resume.experiences,
    (e) => e.start,
    (e) => e.end,
    (e) => e.short,
  );
  const work = pack(
    projects
      .map((p) => {
        const t = timeOf(p);
        const x = px(t);
        const w = 12 + textWidth(shortTitle(p), 15) * 1.05;
        const flip = x + w > px(NOW) - 6; // never run past the "now" line
        return {
          p,
          t,
          x,
          flip,
          x0: flip ? x - w : x - 6,
          x1: flip ? x + 6 : x + w,
        };
      })
      .sort((a, b) => a.t - b.t),
  );

  const bars = layer === "studies" ? studies : roles;
  const barRows = Math.max(...bars.map((s) => s.row)) + 1;
  const workRows = Math.max(...work.map((s) => s.row)) + 1;
  const yChapters = 0;
  const yStudies = 88;
  const yRoles = yStudies;
  const yAxis = yStudies + barRows * BAR_ROW + 14;
  const yWork = yAxis + 64;
  const H = yWork + workRows * ROW + 10;
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].filter(
    (y) => y > T0,
  );

  // scroll: the timeline holds while "now" travels from its first year to today. Roles grow behind it,
  // projects and chapters light as it passes. Wide screens and motion on only; otherwise it rests at now.
  useIsomorphicLayoutEffect(() => {
    if (model !== "linear") return undefined;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1280px) and (prefers-reduced-motion: no-preference)", () => {
      if (!motion) return undefined;
      const wrap = wrapRef.current;
      const head = headRef.current;
      if (!wrap || !head) return undefined;
      const label = head.querySelector('[data-part="label"]');
      const apply = () => {
        const { t, px: x } = sweep.current;
        const at = x(t);
        head.setAttribute("transform", `translate(${at - x(NOW)} 0)`);
        label.textContent = t >= NOW - 0.01 ? "now" : `${MONTHS[Math.floor((t % 1) * 12)]} ${Math.floor(t)}`;
        wrap.querySelectorAll(".jr-item").forEach((el) => el.classList.toggle("is-past", +el.dataset.t <= t));
        wrap.querySelectorAll(".jr-bar").forEach((el) => {
          el.setAttribute("x2", Math.max(+el.dataset.x0, Math.min(+el.dataset.x1, at)));
        });
        wrap.querySelectorAll(".jr-era").forEach((el) => el.classList.toggle("is-on", t >= +el.dataset.from && t < +el.dataset.to));
      };
      const follow = (progress) => {
        const { T0: t0 } = sweep.current;
        sweep.current.t = t0 + (NOW - t0) * progress;
        apply();
        // arrived at now: the whole career reads in full again
        wrap.classList.toggle("jr-live", progress < 1);
      };
      sweep.current.apply = apply;
      wrap.classList.add("jr-live");
      const headerH = () => document.querySelector("header")?.offsetHeight || 65;
      ScrollTrigger.create({
        trigger: wrap,
        // the drawn timeline and its chapters sit in the middle of the room under the header
        start: () => `top ${Math.max(headerH() + 16, (window.innerHeight + headerH() - wrap.offsetHeight) / 2)}px`,
        end: () => `+=${Math.round(window.innerHeight * 1.5)}`,
        pin: true,
        pinSpacing: true, // the parent is a flex column, where GSAP would otherwise leave no room
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: (self) => follow(self.progress),
        onRefresh: (self) => follow(self.progress),
      });
      ScrollTrigger.refresh();
      return () => {
        sweep.current.apply = null;
        sweep.current.t = NOW;
        wrap.classList.remove("jr-live");
        head.removeAttribute("transform");
        label.textContent = "now";
        wrap.querySelectorAll(".jr-item, .jr-era").forEach((el) => el.classList.remove("is-past", "is-on"));
        wrap.querySelectorAll(".jr-bar").forEach((el) => el.setAttribute("x2", el.dataset.x1));
      };
    });
    return () => mm.revert();
  }, [model, motion]);

  // switching roles and studies redraws the layers: put the new ones where the scroll has got to
  useIsomorphicLayoutEffect(() => {
    if (!sweep.current.apply) return;
    const { t } = sweep.current;
    sweep.current.t = Math.max(T0, t);
    sweep.current.apply();
  }, [layer]);

  const bar = (it, kind) => {
    const e = it.e;
    const y = (kind === "study" ? yStudies : yRoles) + it.row * BAR_ROW;
    const ongoing = e.end == null;
    return (
      <g key={`${kind}${e.id}`} className="jr-item" data-t={it.s}>
        <title>{`${kind === "study" ? e.name : e.position} (${e.dates})`}</title>
        <text
          x={it.flip ? Math.min(it.x1b, px(NOW) - 8) : it.bx}
          y={y + 15}
          textAnchor={it.flip ? "end" : "start"}
          fontFamily="Inter Tight, sans-serif"
          fontSize="14"
          fontWeight="500"
          style={{ fill: "rgb(var(--ink))" }}
        >
          {e.short}
        </text>
        <line
          className="jr-bar"
          data-x0={it.bx + 3}
          data-x1={Math.max(it.bx + 3, it.x1b - 3)}
          x1={it.bx + 3}
          y1={y + 24}
          x2={Math.max(it.bx + 3, it.x1b - 3)}
          y2={y + 24}
          style={{ stroke: "rgb(var(--olive))" }}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={ongoing ? "6 5" : undefined}
        />
      </g>
    );
  };

  return (
    <section
      id="journey"
      aria-labelledby="journey-title"
      className="scroll-mt-16 border-t border-ink px-4 py-16 fu-gutter tablet:py-24"
    >
      <div className="flex flex-col gap-8">
        <div className="fu-reveal flex flex-wrap items-end justify-between gap-4">
          <div className="flex max-w-[720px] flex-col gap-2">
            <h2
              id="journey-title"
              className="fu-section-title"
            >
              Timeline
            </h2>
            <p className="text-[18px] leading-snug">{journey.lead}</p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <ModelSwitch model={model} setModel={setModel} />
            {model !== "spiral" && (
              <div
                className="flex"
                role="group"
                aria-label="Show on the timeline"
              >
                {[
                  ["roles", "Show roles"],
                  ["studies", "Show studies"],
                ].map(([v, t]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={layer === v}
                    onClick={() => setLayer(v)}
                    className={`-mr-px min-h-[44px] border border-ink px-4 font-mono text-[14px] ${layer === v ? "bg-ink text-bone" : "bg-paper text-ink hover:bg-bone"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p
          className="max-w-[860px] font-mono text-[14px] leading-relaxed text-graphite"
          aria-live="polite"
        >
          <span className="hidden desktop:inline">{MODELS.find((m) => m.id === model).note}</span>
          <span className="desktop:hidden">{model === "linear" ? "Top to bottom, oldest to newest: the usual way to read a career." : MODELS.find((m) => m.id === model).note}</span>
        </p>

        {model === "spiral" && <Spiral projects={projects} />}

        {model === "linear" && (
          <>
            {/* ——— large screens: the drawn timeline ——— */}
            <div ref={wrapRef} className="hidden desktop:block">
              <div className="fu-reveal">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="h-auto w-full"
                role="group"
                aria-label="Timeline of studies, roles and projects, 2018 to today"
              >
                {journey.chapters
                  .filter((c) => c.to > T0)
                  .map((c) => {
                    const x0 = px(Math.max(c.from, T0));
                    const x1 = px(Math.min(c.to, T1));
                    return (
                      <g key={c.title} aria-hidden="true">
                        {c.from > T0 && (
                          <line
                            x1={x0}
                            y1={yChapters}
                            x2={x0}
                            y2={H}
                            style={{ stroke: "rgb(var(--concrete))" }}
                            strokeDasharray="2 4"
                          />
                        )}
                        <text
                          x={x0 + 8}
                          y={yChapters + 24}
                          fontFamily="JetBrains Mono, monospace"
                          fontSize="13"
                          letterSpacing="0.1em"
                          style={{ fill: "rgb(var(--ink))" }}
                        >
                          {(c.short || c.title).toUpperCase()}
                        </text>
                        <text
                          x={x0 + 8}
                          y={yChapters + 44}
                          fontFamily="JetBrains Mono, monospace"
                          fontSize="13"
                          style={{ fill: "rgb(var(--graphite))" }}
                        >
                          {`${c.from}-${c.to > 2026 ? "now" : c.to}`}
                        </text>
                      </g>
                    );
                  })}
                <text
                  x={PAD}
                  y={yStudies - 8}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="13"
                  style={{ fill: "rgb(var(--graphite))" }}
                  aria-hidden="true"
                >
                  {layer === "studies" ? "STUDIES" : "ROLES"}
                </text>
                {layer === "studies"
                  ? studies.map((it) => bar(it, "study"))
                  : roles.map((it) => bar(it, "role"))}
                <g aria-hidden="true">
                  <line
                    x1={PAD}
                    y1={yAxis}
                    x2={W - PAD}
                    y2={yAxis}
                    style={{ stroke: "rgb(var(--ink))" }}
                    strokeWidth="1.5"
                  />
                  {years.map((y) => (
                    <g key={y}>
                      <line
                        x1={px(y)}
                        y1={yAxis - 6}
                        x2={px(y)}
                        y2={yAxis + 6}
                        style={{ stroke: "rgb(var(--ink))" }}
                      />
                      <text
                        x={px(y)}
                        y={yAxis + 24}
                        textAnchor="middle"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="14"
                        style={{ fill: "rgb(var(--ink))" }}
                      >
                        {y}
                      </text>
                    </g>
                  ))}
                  <g ref={headRef}>
                  <line
                    x1={px(NOW)}
                    y1={yChapters + 56}
                    x2={px(NOW)}
                    y2={H}
                    style={{ stroke: "rgb(var(--olive))" }}
                    strokeWidth="1.5"
                  />
                  <text
                    x={px(NOW) + 6}
                    y={yChapters + 70}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="13"
                    style={{ fill: "rgb(var(--olive))" }}
                    data-part="label"
                  >
                    now
                  </text>
                  </g>
                </g>
                <text
                  x={PAD}
                  y={yAxis + 52}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="13"
                  style={{ fill: "rgb(var(--graphite))" }}
                  aria-hidden="true"
                >
                  PROJECTS
                </text>
                {work.map(({ p, t, x, row, flip }) => {
                  const y = yWork + row * ROW + 10;
                  const wip = p.category === "Work in Progress";
                  return (
                    <a
                      key={p.id}
                      className="jr-item"
                      data-t={t}
                      href={withBase(`/projects/${p.id}/`)}
                      aria-label={`${shortTitle(p)}, ${yearOf(p)}${wip ? ", in progress" : ""}`}
                    >
                      <rect
                        x={x - 5}
                        y={y - 5}
                        width="10"
                        height="10"
                        style={{
                          fill: wip ? "rgb(var(--bone))" : "rgb(var(--ink))",
                          stroke: "rgb(var(--ink))",
                        }}
                        strokeWidth="1.5"
                      />
                      <text
                        x={flip ? x - 12 : x + 12}
                        y={y + 5}
                        textAnchor={flip ? "end" : "start"}
                        fontFamily="Inter Tight, sans-serif"
                        fontSize="15"
                        fontWeight="500"
                        className="hover:underline"
                        style={{ fill: "rgb(var(--ink))" }}
                      >
                        {shortTitle(p)}
                      </text>
                    </a>
                  );
                })}
              </svg>
              <ol className="mt-6 grid grid-cols-4 gap-6">
                {journey.chapters.map((c) => (
                  <li
                    key={c.title}
                    className="jr-era flex flex-col gap-1 border-t-2 border-transparent pt-3"
                    data-from={c.from}
                    data-to={c.to}
                  >
                    <span className="font-mono text-[14px] text-graphite">{`${c.from}-${c.to > 2026 ? "now" : c.to}`}</span>
                    <span className="text-[18px] font-bold">{c.title}</span>
                    <span className="text-[16px] leading-snug">{c.text}</span>
                  </li>
                ))}
              </ol>
              </div>
            </div>

            {/* ——— smaller screens: the same journey as a list ——— */}
            <ol className="flex flex-col desktop:hidden">
              {journey.chapters.map((c) => {
                const inChapter = (t) => t >= c.from && t < c.to;
                const items = [
                  ...(layer === "studies"
                    ? resume.educationList
                        .filter((e) => inChapter(e.start))
                        .map((e) => ({
                          t: e.start,
                          kind: "Study",
                          label: e.name,
                          dates: e.dates,
                        }))
                    : []),
                  ...(layer === "roles"
                    ? resume.experiences
                        .filter((e) => inChapter(e.start))
                        .map((e) => ({
                          t: e.start,
                          kind: "Role",
                          label: e.position,
                          dates: e.dates,
                        }))
                    : []),
                  ...projects
                    .filter((p) => inChapter(timeOf(p)))
                    .map((p) => ({
                      t: timeOf(p),
                      kind: "Project",
                      label: shortTitle(p),
                      dates: String(yearOf(p)),
                      href: `/projects/${p.id}`,
                    })),
                ].sort((a, b) => a.t - b.t);
                return (
                  <li
                    key={c.title}
                    className="border-l-2 border-olive pb-6 pl-4"
                  >
                    <p className="font-mono text-[14px] text-graphite">{`${c.from}-${c.to > 2026 ? "now" : c.to}`}</p>
                    <h3 className="text-[20px] font-bold">{c.title}</h3>
                    <p className="mt-1 text-[16px] leading-snug">{c.text}</p>
                    <ul className="mt-3 flex flex-col gap-2">
                      {items.map((it) => (
                        <li
                          key={it.kind + it.label}
                          className="flex gap-3 text-[16px] leading-snug"
                        >
                          <span className="w-[64px] shrink-0 font-mono text-[14px] text-graphite">
                            {it.kind}
                          </span>
                          {it.href ? (
                            <Link
                              href={it.href}
                              className="font-semibold underline underline-offset-2"
                            >
                              {it.label}
                            </Link>
                          ) : (
                            <span>
                              <span className="font-semibold">{it.label}</span>{" "}
                              <span className="font-mono text-[14px] text-graphite">
                                {it.dates}
                              </span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </section>
  );
};

export default Journey;
