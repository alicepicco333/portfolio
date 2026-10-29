// The practice graph, shared by the home map, the header mark and the project pages.
// Skills have no parent nodes: each links to the ones it actually feeds into. Positions are
// hand-placed in 3D (x, y, z in -1…1) so the shape stays asymmetric.
// `work` lists the projects (by id) where each skill shows up; `tools` are the methods and
// tools behind the skill, taken from what those projects actually used.
export const NODES = [
  { id: "anth", label: "Ethnography", p: [-0.9, -0.7, 0.3], work: ["0"], tools: ["Fieldwork", "Critical theory"] },
  { id: "ur", label: "User research", p: [-0.2, -0.85, 0.55], work: ["20", "17"], tools: ["Interviews", "Personas", "Think-aloud tests"] },
  { id: "cult", label: "Cultural analytics", p: [-0.75, 0.05, -0.1], work: ["12", "3", "15"], tools: ["Web scraping", "CLIP", "Open data"] },
  { id: "dh", label: "Digital humanities", p: [-0.45, -0.35, -0.6], work: ["21", "1", "0", "13"], tools: ["TEI XML", "Digital editions", "HTR"] },
  { id: "arch", label: "Digital archives", p: [-0.95, 0.55, -0.5], work: ["13", "0", "21"], tools: ["Cataloging", "Digitization"] },
  { id: "sem", label: "Semantic web", p: [-0.3, 0.25, -0.95], work: ["12", "2", "21"], tools: ["RDF", "SPARQL", "Wikidata"] },
  { id: "onto", label: "Ontologies", p: [-0.55, 0.8, -0.75], work: ["2", "12"], tools: ["OWL", "eXtreme Design", "Framester"] },
  { id: "hci", label: "HCI", p: [0.15, -0.55, 0.35], work: ["20", "17"], tools: ["Usability testing", "SUS", "Critical data studies"] },
  { id: "ux", label: "UX design", p: [0.55, -0.8, 0.15], work: ["20", "11", "0"], tools: ["Figma", "Prototyping", "Information architecture"] },
  { id: "ixd", label: "Interaction design", p: [0.35, -0.05, 0.75], work: ["20", "0", "3"], tools: ["Multimodal interaction", "Arduino"] },
  { id: "dv", label: "Data visualization", p: [0.05, 0.2, -0.35], work: ["3", "15", "12"], tools: ["D3.js", "Leaflet", "Chart.js"] },
  { id: "vis", label: "Visual design", p: [0.85, -0.35, -0.25], work: ["11", "0", "20"], tools: ["Typography", "Visual identity"] },
  { id: "cc", label: "Creative coding", p: [0.25, 0.6, 0.2], work: ["14", "10", "5"], tools: ["Hydra", "Processing", "JavaScript"] },
  { id: "live", label: "Live coding", p: [0.45, 0.95, -0.3], work: ["14", "10", "5"], tools: ["Hydra", "Audio-reactive visuals"] },
  { id: "perf", label: "Performance", p: [0.9, 0.85, -0.6], work: ["14", "5"], tools: ["VJ sets", "Projection"] },
];

export const EDGES = [
  ["anth", "ur"], ["anth", "cult"], ["anth", "dh"],
  ["dh", "arch"], ["dh", "sem"], ["dh", "dv"], ["sem", "onto"], ["onto", "arch"],
  ["cult", "dv"], ["ur", "hci"], ["hci", "ux"], ["hci", "ixd"], ["ux", "vis"],
  ["dv", "vis"], ["dv", "cc"], ["ixd", "cc"],
  ["cc", "live"], ["live", "perf"],
];

export const neighbours = (id) => EDGES.filter((e) => e.includes(id)).map((e) => (e[0] === id ? e[1] : e[0]));
export const nodeOf = (id) => NODES.find((n) => n.id === id);
export const labelOf = (id) => nodeOf(id).label;

// Skills a project draws on, in graph order.
export const skillsOfProject = (projectId) => NODES.filter((n) => n.work.includes(projectId));

// The skills fall into five named clusters. Their order is also the order of the spokes on a
// project sigil and of the anchors around the work wheel.
export const CLUSTERS = [
  { id: "listening", label: "Listening", skills: ["anth", "ur", "hci"] },
  { id: "shaping", label: "Shaping", skills: ["ux", "vis", "ixd"] },
  { id: "playing", label: "Playing", skills: ["cc", "live", "perf"] },
  { id: "counting", label: "Counting", skills: ["dv", "cult"] },
  { id: "ordering", label: "Ordering", skills: ["sem", "onto", "arch", "dh"] },
];
export const RING = CLUSTERS.flatMap((c) => c.skills);
export const clusterOf = (id) => CLUSTERS.find((c) => c.skills.includes(id));

// One line per skill for the map's card.
export const SKILL_NOTES = {
  anth: "Fieldwork and participant observation: how people actually live with technology, observed rather than assumed.",
  ur: "Interviews, personas and think-aloud tests that turn what people need into design decisions.",
  hci: "Usability testing and a critical eye on how interfaces shape what people can do.",
  ux: "Information architecture, flows and prototypes in Figma, taken through to tested screens.",
  vis: "Typography, layout and visual identity that carry a project's tone.",
  ixd: "How an interface responds: states, transitions and multimodal input, prototyped and tested.",
  cc: "Code as a material for images and sound, in Hydra, Processing and JavaScript.",
  live: "Audio-reactive visuals written live, in front of an audience.",
  perf: "VJ sets and projections for venues and events.",
  dv: "Making datasets about culture explorable: charts, maps and interactive views.",
  cult: "Reading culture at scale with scraped and open data and computational methods.",
  sem: "Linked data with RDF, SPARQL and Wikidata, so collections can be queried and connected.",
  onto: "Formal models in OWL that make a domain classifiable, from memes to cognitive biases.",
  arch: "Cataloging and digitizing collections so they stay findable.",
  dh: "Digital editions and TEI encoding for literary and historical sources.",
};

// The home map is a fixed, hand-placed 2D layout, drawn at 1440 × 920 and scaled to the screen,
// so no node, label or card can leave the frame. `label` is [dx, dy, text-anchor] of the skill chip's text.
export const MAP = {
  W: 1440,
  H: 920,
  // spread over the whole stage: Listening top left, Shaping top right, Ordering bottom left,
  // Counting in the middle, Playing bottom right
  pos: {
    anth: [150, 200], ur: [400, 165], hci: [650, 215], ux: [930, 140], vis: [1200, 205], ixd: [900, 400],
    cc: [1100, 610], live: [1290, 790], perf: [1300, 450], dv: [700, 640], cult: [420, 480],
    dh: [170, 440], arch: [130, 700], sem: [360, 830], onto: [640, 860],
  },
  label: {
    anth: [22, 6, "start"], ur: [22, 6, "start"], hci: [22, 6, "start"], ux: [22, 6, "start"], vis: [22, 6, "start"],
    ixd: [22, 6, "start"], cc: [22, 6, "start"], live: [-22, 6, "end"], perf: [-22, 6, "end"], dv: [22, 6, "start"],
    cult: [22, 6, "start"], dh: [22, 6, "start"], arch: [22, 6, "start"], sem: [22, 6, "start"], onto: [22, 6, "start"],
  },
  clusters: { listening: [330, 330], shaping: [1010, 290], playing: [1130, 530], counting: [480, 720], ordering: [40, 900] },
  // the cropped top strip above the graph: nothing is placed there
  reserved: [[0, 0, 1440, 100]],
};

// Rotate a 3D point and project it onto a W×H canvas.
export function project3d([x, y, z], ay, ax, g) {
  const cy = Math.cos(ay);
  const sy = Math.sin(ay);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cx = Math.cos(ax);
  const sx = Math.sin(ax);
  const y1 = y * cx - z1 * sx;
  const z2 = y * sx + z1 * cx;
  const scale = 2.8 / (2.8 + z2); // perspective
  return { x: g.W / 2 + x1 * scale * g.sx, y: g.H / 2 + g.dy + y1 * scale * g.sy, z: z2, scale };
}
