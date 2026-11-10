// One live-coded Hydra loop per step of the method, each run on a still from a project that used the
// skill (s0). The code shown on the screen is the code that runs. Palette: the still in grey and ink,
// the step's own marks in the electric blue.
export const PATCHES = {
  // listening: the still heard as a signal, its lines picked out as they pass
  listening: `const w = () => osc(60, .03)
  .rotate(1.57).r()
src(s0).saturate(0).contrast(1.3)
  .modulate(w(), .01)
  .color(.83, .84, .87)
  .layer(w().thresh(.97, 0)
    .luma().color(.1, .1, 1))
  .out(o0)`,
  // ordering: the still sorted into cells, the darkest records marked
  ordering: `src(s0).saturate(0).contrast(1.4)
  .pixelate(40, 30)
  .color(.83, .84, .87)
  .layer(src(s0).saturate(0).invert()
    .pixelate(40, 30).thresh(.8)
    .luma().color(.1, .1, 1))
  .scrollY(0, .008)
  .out(o0)`,
  // counting: the still in five levels, its light read off in moving bars
  counting: `src(s0).saturate(0).posterize(5, .9)
  .color(.83, .84, .87)
  .layer(osc(90, .02).r().thresh(.82, 0)
    .mult(src(s0).saturate(0).thresh(.7))
    .luma().color(.1, .1, 1))
  .out(o0)`,
  // shaping: a frame turning over the still, which gives a little as it passes
  shaping: `const sq = (r) => shape(4, r, .002)
  .rotate(0, .08)
src(s0).saturate(0).contrast(1.2)
  .color(.83, .84, .87)
  .layer(sq(.56).diff(sq(.545))
    .luma().color(.1, .1, 1))
  .modulateScale(osc(2, .04), .03)
  .out(o0)`,
  // playing: the still pulled through noise under a five-fold pattern, with feedback
  playing: `src(s0).saturate(0)
  .modulate(noise(3, .1), .05)
  .color(.83, .84, .87)
  .layer(osc(40, -.04).r().thresh(.93, 0)
    .kaleid(5).luma().color(.1, .1, 1))
  .blend(src(o0).scale(1.01), .4)
  .out(o0)`,
};

// the still each skill plays on: a project that used it (card images where they exist)
export const STILLS = {
  anth: ["0", "/images/projects/0-card-v5-800.webp"],
  ur: ["20", "/images/projects/20-card-v12-800.webp"],
  hci: ["17", "/images/projects/17-hl.jpg"],
  arch: ["13", "/images/projects/13-v3-card-800.webp"],
  onto: ["12", "/images/projects/12-card-v4-800.webp"],
  dv: ["12", "/images/projects/12-hl.jpg"],
  ux: ["11", "/images/projects/11-card-v3-800.webp"],
  vis: ["11", "/images/projects/11-hl-v2.jpg"],
  ixd: ["18", "/images/projects/18-card-800.webp"],
  spec: ["18", "/images/projects/18-hl.jpg"],
  live: ["14", "/images/projects/14-card-v3-800.webp"],
};
