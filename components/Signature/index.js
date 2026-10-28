import React from "react";
import { SKILLS, LINKS, VERBS, FRAME } from "./graph";

// Alice's signature: the practice graph of the home map in miniature, with one project's skills lit
// in blue and the verbs of the method they belong to named; everything else stays faint.
//
//   <Signature lit={["ur", "hci", "ux"]} />
//
// Props (all plain values, no site context):
//   lit     skill ids to light (see ./graph.js); unknown ids are ignored
//   size    nominal width in px (default 320); the figure is fluid up to it and the labels are sized for it
//   verbs   show the five verb labels (default true)
//   label   accessible name; without one the figure is decorative (aria-hidden)
// Colours come from CSS custom properties with house defaults, so another site can restyle it:
//   --sig-lit (#1A1AFF), --sig-ink (#0E0E10), --sig-faint (#A5A6AE), --sig-muted (#55555E), --sig-bg (#D5D6DB),
//   --sig-halo (the surface behind the figure; defaults to --sig-bg)
// The verb labels stay 12 px at every size: where each one goes is worked out per size, as close to its
// own cluster as it can sit without covering a node or another verb; a halo in the page colour lets
// it cross a link.
const C = {
  lit: "var(--sig-lit, #1A1AFF)",
  ink: "var(--sig-ink, #0E0E10)",
  faint: "var(--sig-faint, #A5A6AE)",
  muted: "var(--sig-muted, #55555E)",
  bg: "var(--sig-bg, #D5D6DB)",
  halo: "var(--sig-halo, var(--sig-bg, #D5D6DB))", // the surface the figure sits on
};
const [X0, Y0, W, H] = FRAME;
const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
const CSS = `
.sig * { transition: fill 240ms ${EASE}, stroke 240ms ${EASE}, stroke-width 240ms ${EASE}, opacity 240ms ${EASE}, r 240ms ${EASE}; }
@media (prefers-reduced-motion: reduce) { .sig * { transition: none; } }
`;

const LABEL_PX = 12;
// points along every link, for the label placement
const LINK_PTS = LINKS.flatMap(([a, b]) => {
  const [x1, y1] = SKILLS[a].at;
  const [x2, y2] = SKILLS[b].at;
  const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 8);
  return Array.from({ length: n + 1 }, (_, i) => [x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n]);
});
const placed = new Map();
function verbSpots(size) {
  if (placed.has(size)) return placed.get(size);
  const k = W / size;
  const F = LABEL_PX * k;
  const pad = 0.3 * F;
  const nodeR = 5 * k;
  const taken = [];
  const out = {};
  VERBS.forEach((v) => {
    const w = v.label.length * 0.72 * F;
    let best = null;
    for (let dx = -320; dx <= 320; dx += 16) {
      for (let dy = -320; dy <= 320; dy += 16) {
        const x = v.at[0] + dx;
        const y = v.at[1] + dy;
        const b = [x - pad, y - 0.74 * F - pad, x + w + pad, y + 0.06 * F + pad];
        let score = Math.hypot(dx, dy) * 4;
        const out1 = Math.max(0, X0 - b[0]) + Math.max(0, Y0 - b[1]) + Math.max(0, b[2] - X0 - W) + Math.max(0, b[3] - Y0 - H);
        score += out1 * 400;
        Object.values(SKILLS).forEach(({ at: [px, py] }) => {
          if (px > b[0] - nodeR && px < b[2] + nodeR && py > b[1] - nodeR && py < b[3] + nodeR) score += 5000;
        });
        LINK_PTS.forEach(([px, py]) => {
          if (px > b[0] && px < b[2] && py > b[1] && py < b[3]) score += 12;
        });
        taken.forEach((t) => {
          if (b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]) score += 1e5;
        });
        if (!best || score < best.score) best = { score, x, y, b };
      }
    }
    taken.push(best.b);
    out[v.id] = [best.x, best.y];
  });
  placed.set(size, out);
  return out;
}

const Signature = ({ lit = [], size = 320, verbs = true, label, className = "", style }) => {
  const on = new Set(lit.filter((id) => SKILLS[id]));
  const k = W / size; // design units per screen pixel
  const r = (px) => px * k;
  const labelPx = LABEL_PX;
  const spots = verbs ? verbSpots(size) : null;
  return (
    <svg
      className={`sig ${className}`}
      viewBox={`${X0} ${Y0} ${W} ${H}`}
      width="100%"
      style={{ maxWidth: size, display: "block", overflow: "visible", ...style }}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true, focusable: "false" })}
    >
      <style>{CSS}</style>
      {LINKS.map(([a, b]) => {
        const both = on.has(a) && on.has(b);
        const one = on.has(a) || on.has(b);
        const [x1, y1] = SKILLS[a].at;
        const [x2, y2] = SKILLS[b].at;
        return (
          <line
            key={`${a}-${b}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            style={{ stroke: both ? C.lit : one ? C.ink : C.faint, strokeWidth: both ? 2.5 : 1, opacity: both ? 1 : one ? 0.55 : 0.8 }}
          />
        );
      })}
      {Object.entries(SKILLS).map(([id, s]) => {
        const lit1 = on.has(id);
        const rr = r(lit1 ? 4.5 : 2.5);
        return (
          <circle
            key={id}
            cx={s.at[0]}
            cy={s.at[1]}
            r={rr}
            vectorEffect="non-scaling-stroke"
            style={{ r: rr, fill: lit1 ? C.lit : C.bg, stroke: lit1 ? C.lit : C.muted, strokeWidth: 1 }}
          />
        );
      })}
      {verbs &&
        VERBS.map((v) => {
          const hot = v.skills.some((s) => on.has(s));
          return (
            <text
              key={v.id}
              x={spots[v.id][0]}
              y={spots[v.id][1]}
              fontFamily="'JetBrains Mono', ui-monospace, monospace"
              fontSize={r(labelPx)}
              letterSpacing={r(labelPx * 0.12)}
              fontWeight={hot ? 700 : 500}
              strokeWidth={r(4)}
              strokeLinejoin="round"
              style={{ fill: hot ? C.lit : C.ink, opacity: hot ? 1 : 0.7, stroke: C.halo, paintOrder: "stroke" }}
            >
              {v.label.toUpperCase()}
            </text>
          );
        })}
    </svg>
  );
};

// "Listening, Shaping": the verbs a set of skills falls under, in the method's order
export const verbsOf = (lit = []) => VERBS.filter((v) => v.skills.some((s) => lit.includes(s))).map((v) => v.label);

export default Signature;
