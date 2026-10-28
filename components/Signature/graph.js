// The practice graph as the signature draws it: the hero map's fifteen skills at their hand-placed
// positions (design units of the 1440 × 920 map), the links between them and the five method verbs.
// Self-contained on purpose, so the signature can be copied to Alice's project sites as is.
// Mirrors components/Graph/data.js (NODES ids, EDGES, CLUSTERS, MAP.pos); change both together.
export const SKILLS = {
  anth: { label: "Ethnography", at: [150, 200] },
  ur: { label: "User research", at: [400, 165] },
  hci: { label: "HCI", at: [650, 215] },
  ux: { label: "UX design", at: [930, 140] },
  vis: { label: "Visual design", at: [1200, 205] },
  ixd: { label: "Interaction design", at: [900, 400] },
  cc: { label: "Creative coding", at: [1100, 610] },
  live: { label: "Live coding", at: [1290, 790] },
  perf: { label: "Performance", at: [1300, 450] },
  dv: { label: "Data visualization", at: [700, 640] },
  cult: { label: "Cultural analytics", at: [420, 480] },
  dh: { label: "Digital humanities", at: [170, 440] },
  arch: { label: "Digital archives", at: [130, 700] },
  sem: { label: "Semantic web", at: [360, 830] },
  onto: { label: "Ontologies", at: [640, 860] },
};

export const LINKS = [
  ["anth", "ur"], ["anth", "cult"], ["anth", "dh"],
  ["dh", "arch"], ["dh", "sem"], ["dh", "dv"], ["sem", "onto"], ["onto", "arch"],
  ["cult", "dv"], ["ur", "hci"], ["hci", "ux"], ["hci", "ixd"], ["ux", "vis"],
  ["dv", "vis"], ["dv", "cc"], ["ixd", "cc"],
  ["cc", "live"], ["live", "perf"],
];

// the verbs in the order of the method (keys 1-5 on the home map), each written where its cluster sits
export const VERBS = [
  { id: "listening", label: "Listening", skills: ["anth", "ur", "hci"], at: [330, 300] },
  { id: "ordering", label: "Ordering", skills: ["sem", "onto", "arch", "dh"], at: [100, 885] },
  { id: "counting", label: "Counting", skills: ["dv", "cult"], at: [395, 665] },
  { id: "shaping", label: "Shaping", skills: ["ux", "vis", "ixd"], at: [930, 232] },
  { id: "playing", label: "Playing", skills: ["cc", "live", "perf"], at: [1075, 392] },
];

// the part of the map with ink in it (the top strip of the hero is empty)
export const FRAME = [70, 105, 1310, 800];
