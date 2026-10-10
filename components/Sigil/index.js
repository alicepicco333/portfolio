import React from "react";
import { RING } from "../Graph/data";

// A project's graph, as on the work wheel: the fifteen skills around a ring, the project's pin
// pulled towards the skills it uses, and a spoke from the pin to each of them.
// `SigilG` draws inside an existing <svg>; `Sigil` is a standalone figure.
const angleOf = (id) => -Math.PI / 2 + (2 * Math.PI * RING.indexOf(id)) / RING.length;

export const pinOf = (skills, cx, cy, r) => {
  const used = skills.filter((s) => RING.includes(s));
  if (!used.length) return [cx, cy];
  const x = used.reduce((a, s) => a + Math.cos(angleOf(s)), 0) / used.length;
  const y = used.reduce((a, s) => a + Math.sin(angleOf(s)), 0) / used.length;
  return [cx + x * r * 0.78, cy + y * r * 0.78];
};

export const SigilG = ({ cx, cy, r, skills, color = "rgb(var(--olive))", width = 2, className }) => {
  const [px, py] = pinOf(skills, cx, cy, r);
  const dot = Math.max(1.4, r * 0.05);
  return (
    <g className={className}>
      <circle cx={cx} cy={cy} r={r} fill="none" style={{ stroke: color }} strokeWidth="1" strokeOpacity="0.45" />
      {skills
        .filter((s) => RING.includes(s))
        .map((s) => (
          <line key={s} className="sigil-edge" x1={px} y1={py} x2={cx + r * Math.cos(angleOf(s))} y2={cy + r * Math.sin(angleOf(s))} style={{ stroke: color }} strokeWidth={width} strokeLinecap="round" />
        ))}
      {RING.map((s) => {
        const on = skills.includes(s);
        return (
          <circle
            key={s}
            className={on ? "sigil-dot" : undefined}
            cx={cx + r * Math.cos(angleOf(s))}
            cy={cy + r * Math.sin(angleOf(s))}
            r={on ? dot * 1.6 : dot}
            style={on ? { fill: color } : { fill: "rgb(var(--bone))", stroke: color }}
            strokeWidth="1"
            strokeOpacity="0.6"
          />
        );
      })}
      <circle className="sigil-dot" cx={px} cy={py} r={dot * 2.2} style={{ fill: color }} />
    </g>
  );
};

const Sigil = ({ skills, size = 96, className = "", ...rest }) => {
  const r = size / 2 - Math.max(4, size * 0.06);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true" focusable="false">
      <SigilG cx={size / 2} cy={size / 2} r={r} skills={skills} {...rest} />
    </svg>
  );
};

export default Sigil;
