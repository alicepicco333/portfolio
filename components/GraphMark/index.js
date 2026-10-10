import React from "react";

// A five-node constellation in the practice graph's line style: the site's mark and home button.
const NODES = [
  [6, 10],
  [15, 5],
  [26, 11],
  [11, 23],
  [24, 26],
];
const EDGES = [
  [0, 1],
  [1, 2],
  [0, 3],
  [1, 3],
  [2, 4],
  [3, 4],
];

const GraphMark = ({ size = 32, className = "" }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" focusable="false">
    <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      {EDGES.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />
      ))}
    </g>
    {NODES.map(([x, y], i) => (
      <circle
        key={i}
        cx={x}
        cy={y}
        r={i === 1 ? 3.6 : 2.6}
        style={{ fill: i === 1 ? "rgb(var(--olive))" : "currentColor" }}
      />
    ))}
  </svg>
);

export default GraphMark;
