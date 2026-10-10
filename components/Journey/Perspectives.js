import React, { useMemo, useState } from "react";
import Link from "next/link";
import portfolioData from "../../data/portfolio.json";
import { CLUSTERS, skillsOfProject } from "../Graph/data";
import { withBase } from "../../utils";
import { textWidth } from "../../utils/layout";

// Two ways to read the timeline. Linear stays the default; the spiral is an opt-in view of the same
// data, also available as a plain list for small screens and assistive tech.

export const MODELS = [
  { id: "linear", label: "Linear", note: "Left to right, oldest to newest: the usual way to read a career." },
  {
    id: "spiral",
    label: "Spiral",
    note: "Time as a spiral: the work keeps coming back to the same five phases (listen, order, count, shape, play) but never to the same place. Each lap is a chapter, from the centre outwards; each item sits where its chapter meets the phase it leans on most.",
  },
];

const TINT = "color-mix(in srgb, rgb(var(--olive)) 16%, #fff)";
const yearOf = (p) => +(((p.dateLabel || "").match(/\d{4}/) || [(p.date || "").slice(0, 4)])[0]);
const timeOf = (p) => {
  const y = yearOf(p);
  const [dy, dm] = (p.date || "").split("-").map(Number);
  return y + (dy === y && dm ? (dm - 1) / 12 : 0.5);
};
const shortTitle = (p) => p.short || p.title.split(" - ")[0];

// the selector: native radios, so arrow keys move between options
export const ModelSwitch = ({ model, setModel }) => (
  <fieldset className="flex flex-col gap-1">
    <legend className="mb-1 font-mono text-[14px] text-graphite">Read time as</legend>
    <div className="flex">
      {MODELS.map((m) => (
        <label key={m.id} className="relative -mr-px">
          <input type="radio" name="time-model" value={m.id} checked={model === m.id} onChange={() => setModel(m.id)} className="peer sr-only" />
          <span className="flex min-h-[44px] cursor-pointer items-center border border-ink bg-paper px-4 font-mono text-[14px] text-ink hover:bg-bone peer-checked:bg-ink peer-checked:text-bone peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-olive">
            {m.label}
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);

// ——— Spiral: phases as directions, chapters as laps ———
const PHASE_VERB = { listening: "listen", ordering: "order", counting: "count", shaping: "shape", playing: "play" };
// clockwise reading order, starting at the top
const LOOP = ["listening", "ordering", "counting", "shaping", "playing"];
const phaseOf = (skills) => {
  let best = null;
  CLUSTERS.forEach((c) => {
    const k = c.skills.filter((s) => skills.includes(s)).length;
    if (k && (!best || k > best.k)) best = { id: c.id, k };
  });
  return best?.id;
};
// studies carry no skills: their phase by subject
const STUDY_PHASE = { e1: "listening", e2: "ordering", e3: "listening", e4: "listening" };

const SW = 1200;
const SH = 1015;
const SX = 600;
const SY = 555;
const R0 = 62; // radius where the spiral starts
const LAP = 96; // growth per lap
const SECTOR = 360 / LOOP.length;
const deg = (d) => (d * Math.PI) / 180;
// an angle along the spiral, in degrees from the top, clockwise; 360 = one lap
const rAt = (a) => R0 + (LAP * a) / 360;
const xy = (a, r = rAt(a)) => [SX + r * Math.sin(deg(a)), SY - r * Math.cos(deg(a))];

const spiralData = (projects) => {
  const chapters = portfolioData.journey.chapters;
  const lapOf = (t) => Math.max(0, chapters.findIndex((c) => t >= c.from && t < c.to));
  const items = [];
  projects.forEach((p) => {
    const ph = phaseOf(skillsOfProject(p.id).map((n) => n.id));
    if (ph) items.push({ key: `p${p.id}`, label: shortTitle(p), href: `/projects/${p.id}`, kind: "project", t: timeOf(p), ph, title: `${p.title} (${yearOf(p)})` });
  });
  portfolioData.resume.experiences.forEach((r) => {
    const ph = phaseOf(r.skills || []);
    if (ph) items.push({ key: `r${r.id}`, label: r.short.split(" · ")[0], kind: "role", t: r.start, ph, title: `${r.position} (${r.dates})` });
  });
  portfolioData.resume.educationList.forEach((e) => {
    const ph = STUDY_PHASE[e.id];
    if (ph) items.push({ key: `s${e.id}`, label: e.short.split(" · ")[0], kind: "study", t: e.start, ph, title: `${e.name} (${e.dates})` });
  });
  // group by (lap, phase), spread each group along its stretch of the spiral in time order
  const groups = {};
  items.forEach((it) => {
    it.lap = lapOf(it.t);
    (groups[`${it.lap}-${it.ph}`] ||= []).push(it);
  });
  Object.values(groups).forEach((g) => {
    g.sort((a, b) => a.t - b.t);
    const spread = Math.min(SECTOR - 16, 13 * (g.length - 1));
    g.forEach((it, i) => {
      const off = g.length > 1 ? -spread / 2 + (spread * i) / (g.length - 1) : 0;
      it.a = it.lap * 360 + LOOP.indexOf(it.ph) * SECTOR + off;
      [it.x, it.y] = xy(it.a);
    });
  });
  return { items, chapters };
};

// label placement: for each label, try positions around its dot and keep the one that overlaps nothing,
// crosses the fewest turns of the spiral (label and leader), and stays closest to its dot
const LH = 22;
// which turn of the spiral a point lies past: an integer exactly on the curve
const turnAt = (x, y, ref) => {
  let th = (Math.atan2(x - SX, SY - y) * 180) / Math.PI;
  while (th - ref > 180) th -= 360;
  while (ref - th > 180) th += 360;
  const r = Math.hypot(x - SX, y - SY);
  return { u: (r - R0) / LAP - th / 360, th };
};
// how many drawn turns a polyline of points crosses
const crossings = (pts, a0, a1) => {
  const ref = (Math.atan2(pts[0][0] - SX, SY - pts[0][1]) * 180) / Math.PI;
  let n = 0;
  let prev = turnAt(pts[0][0], pts[0][1], ref);
  for (let i = 1; i < pts.length; i += 1) {
    const cur = turnAt(pts[i][0], pts[i][1], ref);
    const f0 = Math.floor(prev.u);
    const f1 = Math.floor(cur.u);
    if (f0 !== f1) {
      const k = Math.max(f0, f1);
      const al = cur.th + 360 * k;
      if (al >= a0 && al <= a1) n += 1;
    }
    prev = cur;
  }
  return n;
};
const hit = (A, B) => Math.max(0, Math.min(A[2], B[2]) - Math.max(A[0], B[0])) * Math.max(0, Math.min(A[3], B[3]) - Math.max(A[1], B[1]));

const placeLabels = (items, fixed, a0, a1) => {
  const placed = fixed.map((f) => [...f]);
  const out = {};
  const order = [...items].sort((p, q) => p.lap - q.lap || (p.kind === "project" ? 0 : 1) - (q.kind === "project" ? 0 : 1) || p.a - q.a);
  order.forEach((it) => {
    const w = textWidth(it.label, 13) * 1.05 + 14;
    let best = null;
    for (let dr = -LAP * 0.6; dr <= LAP * 0.62; dr += LAP / 10) {
      for (let da = -24; da <= 24; da += 4) {
        const r = rAt(it.a) + dr;
        if (r < R0 * 0.6) continue;
        const [cx, cy] = xy(it.a + da, r);
        [cx - w / 2, cx - w, cx].forEach((x0) => {
          const R = [x0, cy - LH / 2, x0 + w, cy + LH / 2];
          if (R[0] < 6 || R[2] > SW - 6 || R[1] < 6 || R[3] > SH - 6) return;
          let score = 0;
          const P = [R[0] - 4, R[1] - 4, R[2] + 4, R[3] + 4];
          placed.forEach((F) => {
            const o = hit(P, F);
            if (o) score += 10000 + o;
          });
          if (score >= 10000 && best && best.score < 10000) return;
          items.forEach((o) => {
            if (o.x > R[0] - 7 && o.x < R[2] + 6 && o.y > R[1] - 6 && o.y < R[3] + 6) score += 600;
          });
          // spiral lines through the label: walk its middle and its two long edges
          const n = Math.max(3, Math.ceil(w / 8));
          [R[1] + 2, cy, R[3] - 2].forEach((yy) => {
            score += 170 * crossings(Array.from({ length: n + 1 }, (_, k) => [R[0] + (w * k) / n, yy]), a0, a1);
          });
          // the leader, from the dot to the nearest point of the label
          const lx = Math.min(Math.max(it.x, R[0]), R[2]);
          const ly = Math.min(Math.max(it.y, R[1]), R[3]);
          const d = Math.hypot(lx - it.x, ly - it.y);
          if (d > 2) score += 240 * crossings(Array.from({ length: 9 }, (_, k) => [it.x + ((lx - it.x) * k) / 8, it.y + ((ly - it.y) * k) / 8]), a0, a1);
          score += d * 3 + Math.abs(da) * 0.4;
          if (!best || score < best.score) best = { score, R };
        });
      }
    }
    placed.push(best.R);
    out[it.key] = { x: best.R[0], y: (best.R[1] + best.R[3]) / 2, l: 0, w };
  });
  return out;
};

export const Spiral = ({ projects }) => {
  const [hot, setHot] = useState(null);
  const { items, chapters } = useMemo(() => spiralData(projects), [projects]);
  const laps = chapters.length;
  const now = portfolioData.journey.chapters.length - 1;
  // the curve: from the start of the first lap to "now", then a dashed stretch for what comes next
  const curve = (a0, a1) =>
    Array.from({ length: Math.ceil((a1 - a0) / 3) + 1 }, (_, k) => xy(Math.min(a1, a0 + k * 3)))
      .map(([x, y], k) => `${k ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
  const aStart = -SECTOR / 2;
  const aNow = now * 360 + 360 - SECTOR / 2;
  const phaseR = rAt(laps * 360) + 78;
  const phaseBoxes = LOOP.map((id, i) => {
    const a = i * SECTOR;
    const label = CLUSTERS.find((c) => c.id === id).label.toUpperCase();
    const w = textWidth(label, 13, true) + 18;
    const [x, y] = xy(a, phaseR);
    return { id, label, w, x, y, a };
  });
  const fixed = [
    ...phaseBoxes.map((p) => [p.x - p.w / 2 - 4, p.y - 17, p.x + p.w / 2 + 4, p.y + 17]),
    [SX - 60, SY - 22, SX + 60, SY + 22],
  ];
  const labels = useMemo(() => placeLabels(items, fixed, aStart, aNow + 70), [items]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* large screens: the spiral */}
      <div className="mx-auto hidden w-full max-w-[1160px] desktop:block">
        <svg viewBox={`0 0 ${SW} ${SH}`} className="h-auto w-full" role="group" aria-label="Projects, roles and studies on a spiral: each lap a chapter from the centre outwards, each direction one of five phases: listen, order, count, shape, play">
          <defs>
            <marker id="spiral-arrow" viewBox="0 -5 10 10" refX="8" refY="0" markerWidth="9" markerHeight="9" orient="auto">
              <path d="M0,-4L8,0L0,4" style={{ fill: "rgb(var(--olive))" }} />
            </marker>
          </defs>
          {/* phase directions: faint spokes between the sectors */}
          {LOOP.map((id, i) => {
            const [x0, y0] = xy(i * SECTOR + SECTOR / 2, R0 - 20);
            const [x1, y1] = xy(i * SECTOR + SECTOR / 2, phaseR + 6);
            return <line key={id} x1={x0} y1={y0} x2={x1} y2={y1} style={{ stroke: "rgb(var(--concrete))" }} strokeWidth="1" strokeDasharray="2 5" aria-hidden="true" />;
          })}
          {/* the spiral itself */}
          <path d={curve(aStart, aNow)} fill="none" style={{ stroke: "rgb(var(--olive))" }} strokeWidth="2" markerEnd="url(#spiral-arrow)" aria-hidden="true" />
          <path d={curve(aNow + 4, aNow + 70)} fill="none" style={{ stroke: "rgb(var(--olive))" }} strokeWidth="1.5" strokeDasharray="4 5" aria-hidden="true" />
          <text x={SX} y={SY - 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="12" style={{ fill: "rgb(var(--graphite))" }} aria-hidden="true">
            2018, from
          </text>
          <text x={SX} y={SY + 12} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="12" style={{ fill: "rgb(var(--graphite))" }} aria-hidden="true">
            the centre ↻
          </text>
          {/* phases, outside the last lap */}
          {phaseBoxes.map((p) => (
            <g key={p.id} aria-hidden="true">
              <rect x={p.x - p.w / 2} y={p.y - 13} width={p.w} height="26" style={{ fill: "rgb(var(--olive))" }} />
              <text x={p.x} y={p.y + 5} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="13" style={{ fill: "#fff" }}>
                {p.label}
              </text>
            </g>
          ))}
          {/* items: a dot on the curve, a label nearby, a leader between them */}
          {items.map((it) => {
            const L = labels[it.key];
            const project = it.kind === "project";
            const over = project && hot === it.key;
            const bx = L.x + L.l;
            const by = L.y - 11;
            const cx = Math.min(Math.max(it.x, bx), bx + L.w);
            const cy = Math.min(Math.max(it.y, by), by + 22);
            const body = (
              <>
                <line x1={it.x} y1={it.y} x2={cx} y2={cy} style={{ stroke: over ? "rgb(var(--olive))" : "rgb(var(--graphite))" }} strokeWidth="1" />
                <circle
                  cx={it.x}
                  cy={it.y}
                  r={project ? 5 : 4}
                  style={{ fill: project ? (over ? "rgb(var(--olive))" : "rgb(var(--ink))") : "#fff", stroke: project ? "none" : over ? "rgb(var(--olive))" : "rgb(var(--graphite))" }}
                  strokeWidth="1.5"
                />
                <rect x={bx} y={by} width={L.w} height="22" style={{ fill: over ? TINT : project ? "rgb(var(--paper))" : "#fff", stroke: over ? "rgb(var(--olive))" : project ? "rgb(var(--ink))" : "rgb(var(--concrete))", transition: "fill .2s" }} strokeWidth={over ? 2 : 1} />
                <text x={bx + L.w / 2} y={L.y + 4.5} textAnchor="middle" fontFamily="Inter Tight, sans-serif" fontSize="13" fontWeight={project ? 500 : 400} style={{ fill: over ? "rgb(var(--olive))" : project ? "rgb(var(--ink))" : "rgb(var(--graphite))" }}>
                  {it.label}
                </text>
              </>
            );
            const phase = CLUSTERS.find((c) => c.id === it.ph).label;
            const chapter = chapters[it.lap].title;
            const hover = { onMouseEnter: () => setHot(it.key), onMouseLeave: () => setHot(null), onFocus: () => setHot(it.key), onBlur: () => setHot(null) };
            return it.href ? (
              <a key={it.key} href={withBase(`${it.href}/`)} aria-label={`${it.label}: ${chapter}, ${phase} phase`} {...hover}>
                <title>{it.title}</title>
                {body}
              </a>
            ) : (
              <g key={it.key} role="img" aria-label={`${it.kind === "role" ? "Role" : "Study"}: ${it.title}, ${chapter}, ${phase} phase`}>
                {body}
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[14px] text-graphite" aria-hidden="true">
          <span className="flex items-center gap-2"><span className="inline-block h-[11px] w-[11px] rounded-full bg-ink" /> project</span>
          <span className="flex items-center gap-2"><span className="inline-block h-[9px] w-[9px] rounded-full border-[1.5px] border-graphite bg-white" /> role or study</span>
          <span className="flex items-center gap-2"><span className="inline-block h-0 w-6 border-t-2 border-dashed border-olive" /> what comes next</span>
        </div>
      </div>
      {/* smaller screens and a plain reading order: lap by lap, phase by phase */}
      <ol className="flex flex-col gap-6 desktop:hidden">
        {chapters.map((c, lap) => {
          const inLap = items.filter((it) => it.lap === lap);
          if (!inLap.length) return null;
          return (
            <li key={c.title} className="border-l-2 border-olive pl-4">
              <h3 className="text-[20px] font-bold">
                {c.title} <span className="font-mono text-[14px] font-normal text-graphite">· {c.from}-{c.to > 2026 ? "now" : c.to}</span>
              </h3>
              <ul className="mt-2 flex flex-col gap-2">
                {LOOP.map((ph) => {
                  const here = inLap.filter((it) => it.ph === ph).sort((a, b) => a.t - b.t);
                  if (!here.length) return null;
                  return (
                    <li key={ph} className="text-[16px]">
                      <span className="font-mono text-[12px] uppercase text-olive">{PHASE_VERB[ph]} </span>
                      {here.map((it, i) => (
                        <React.Fragment key={it.key}>
                          {i ? ", " : ""}
                          {it.href ? (
                            <Link href={it.href} className="font-semibold underline underline-offset-2">
                              {it.label}
                            </Link>
                          ) : (
                            <span className="text-graphite">{it.label}</span>
                          )}
                        </React.Fragment>
                      ))}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
        <li className="pl-4 font-mono text-[14px] text-graphite">↻ and outwards, into the next lap</li>
      </ol>
    </>
  );
};
