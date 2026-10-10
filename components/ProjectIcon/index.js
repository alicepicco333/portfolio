import React from "react";

// One pictogram per project, drawn as a favicon: a white glyph on a blue tile. Projects with a
// favicon of their own keep its shape (recoloured to the site's blue); the others get a glyph
// that fits the work. All glyphs are drawn on a 32 × 32 grid.
const S = { fill: "none", stroke: "#fff", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };
const F = { fill: "#fff" };
const B = { fill: "rgb(var(--olive))" };

const GLYPHS = {
  // The Stolen Archive: the luggage tag from its favicon
  0: (
    <>
      <path d="M20 3.5 C 15 5.5, 13 8.5, 13.5 11" {...S} strokeWidth="1.8" />
      <g transform="rotate(-18 16 18)">
        <path d="M10 11 L18 7 L26 11 L26 26 Q26 28 24 28 L12 28 Q10 28 10 26 Z" {...F} />
        <circle cx="18" cy="11.8" r="1.8" {...B} />
        <rect x="13" y="17" width="10" height="1.9" rx="0.9" {...B} />
        <rect x="13" y="21" width="7" height="1.9" rx="0.9" {...B} />
      </g>
    </>
  ),
  // Digitalian Folktales: two overlapping tales
  1: (
    <>
      <circle cx="12" cy="13" r="7" {...S} fill="rgba(255,255,255,.25)" />
      <circle cx="20" cy="20" r="7" {...S} />
    </>
  ),
  // Cognitive Bias Ontology: two linked classes
  2: (
    <>
      <rect x="5" y="5" width="10" height="8" {...F} />
      <rect x="17" y="19" width="10" height="8" {...S} strokeWidth="2" />
      <path d="M10 13 v10 h7" {...S} strokeWidth="2" />
    </>
  ),
  // wipEU: the symbol from its favicon
  3: (
    <>
      <circle cx="16" cy="12" r="6.5" {...S} strokeWidth="3" />
      <path d="M16 18.5 V28 M11.5 23.5 H20.5" {...S} strokeWidth="3" strokeLinecap="square" />
    </>
  ),
  // Glitching Materiality: an old monitor, its picture torn by a glitch
  5: (
    <>
      <rect x="5" y="6" width="22" height="16" {...S} />
      <path d="M9 12 h8 M13 16 h10" {...S} strokeWidth="2.6" />
      <path d="M12 26 h8 M16 22 v4" {...S} />
    </>
  ),
  // Collaboratory Creative Coding Jam: code
  10: <path d="M11 10 L5 16 L11 22 M21 10 L27 16 L21 22 M18.5 7.5 L13.5 24.5" {...S} />,
  // Teigetje & Woelrat: a hanger
  11: <path d="M13.2 10.5 a2.8 2.8 0 1 1 2.8 2.8 v2.2 L5 23.5 H27 L16 15.5" {...S} strokeWidth="2.2" />,
  // The Meme Ontology: a framed face
  12: (
    <>
      <rect x="6" y="6" width="20" height="20" rx="3" {...S} />
      <circle cx="12.3" cy="13.5" r="1.7" {...F} />
      <circle cx="19.7" cy="13.5" r="1.7" {...F} />
      <path d="M11 19 Q16 23.5 21 19" {...S} />
    </>
  ),
  // Archivio Luki Massa: an archive box
  13: (
    <>
      <rect x="5" y="6" width="22" height="5" rx="1" {...F} />
      <rect x="6.5" y="11" width="19" height="15" {...S} />
      <path d="M13 16 h6" {...S} />
    </>
  ),
  // 5PIC3 live: a waveform
  14: <path d="M7 14 v4 M10.5 10.5 v11 M14 6.5 v19 M17.5 11.5 v9 M21 8.5 v15 M24.5 13 v6" {...S} />,
  // Culture4All: the square from its favicon
  15: <rect x="8" y="8" width="16" height="16" {...F} />,
  // Rijksmuseum conversational interface: a museum front
  17: (
    <>
      <path d="M5 12 L16 6 L27 12 Z" {...F} />
      <path d="M9 14.5 v8.5 M14 14.5 v8.5 M18 14.5 v8.5 M23 14.5 v8.5 M5 25.5 h22" {...S} strokeWidth="2.2" />
    </>
  ),
  // Unobravo: a conversation
  20: (
    <>
      <path d="M7 8 h18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-9 l-5.5 4.5 v-4.5 h-3.5 a2 2 0 0 1 -2 -2 v-10 a2 2 0 0 1 2 -2 z" {...S} />
      <circle cx="11.5" cy="15" r="1.5" {...F} />
      <circle cx="16" cy="15" r="1.5" {...F} />
      <circle cx="20.5" cy="15" r="1.5" {...F} />
    </>
  ),
  // Words of Gender: an open book, one passage highlighted
  21: (
    <>
      <path d="M16 9 C 12.5 7, 8.5 7, 5 8 V 25 C 8.5 24, 12.5 24, 16 26 C 19.5 24, 23.5 24, 27 25 V 8 C 23.5 7, 19.5 7, 16 9 Z M16 9 V 26" {...S} strokeWidth="2.2" />
      <rect x="18.5" y="13" width="6" height="3" {...F} />
      <path d="M8 14.5 h5 M8 18.5 h5 M19 20 h5" {...S} strokeWidth="1.8" />
    </>
  ),
};

// Inside an existing <svg>, centred on (x, y).
export const ProjectIconG = ({ id, x, y, size = 28, tile = "rgb(var(--olive))", className }) => (
  <g className={className} transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 32})`}>
    <rect width="32" height="32" style={{ fill: tile }} />
    {GLYPHS[id] || <circle cx="16" cy="16" r="5" {...F} />}
  </g>
);

const ProjectIcon = ({ id, size = 28, className = "" }) => (
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true" focusable="false">
    <ProjectIconG id={id} x={size / 2} y={size / 2} size={size} />
  </svg>
);

export default ProjectIcon;
