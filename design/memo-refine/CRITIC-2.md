# Design review 2: home and visualizations, with memo-refine.css (12 Nov 2026)

design-critic on the preview (http://127.0.0.1:5192/, the live site plus memo-refine.css) and the
live site, at 1440x900, 1280x800 and 390x844, measured in the browser. Alice's complaints: "not
enough whitespace" and "the layout is not really visually interesting".

Main finding: the refine changed type, frames and labels but no spacing. Home positions are the live
site's (24 px higher without the ticker). On visualizations all 11 sections are exactly 852 px
(viewport minus bar), every title 32 px, every chart runs from the contents column to the window edge.

Spacing scale: 4, 8, 16, 24, 32, 48, 64, 96, 128, 192 (the two pages now use 15 values).

| Where | Now | Target |
|---|---|---|
| Hero: title to tagline / tagline to button | 20 / 20 | 24 / 32 |
| Ground line to Arrange | 16 | 64 |
| Arrange to its note | 2 | 8 (same line from 1100 px) |
| Note to wall | 22 | 32 |
| Wall side margins / gutters, desktop | 28 / 10 | 48 / 16 |
| Wall gutters, phone | 6 | 8 |
| Wall to end link / link to footer | 88 / 64 | link inside a 320 px fade / 128 |
| Phone: bar to title | 4 (live 28) | 32 |
| Phone: button to Arrange / Arrange to note / note to wall | 95 / 2 / 22 | 64 / 8 / 24 |
| Visualizations: space above a title | 56 inside a fixed-height box | 32, plus 96 between sections, 192 before a new group |
| Visualizations: header to chart | 18 | 32 |
| Chart box to right window edge | 0 | 48 (the spectrum stays at 0 on purpose) |
| First text inside a chart vs title edge | 25 to 66 further right | 0 |
| Last chart to footer | 0 | 128 |
| Contents column width / item height | 164 / 45 to 78 | 208 / 44 to 64 |

## Findings (ranked)

1. **Home, hero to wall (CSS).** `.home-hero .hero-content{margin-bottom:64px;gap:24px}`,
   `.home-hero .hero-cta{margin-top:8px}`, `.home-hero .hero-tagline{text-wrap:balance}`,
   `.home-hero .hero-title{letter-spacing:.01em}`. From 1100 px: Arrange on the wall's left edge,
   the note on the same line at the wall's right edge:
   `@media (min-width:1100px){.home-hero{display:grid;grid-template-columns:auto 1fr;column-gap:32px}
   .home-hero>.hero-content,.home-hero>.hero-images,.home-hero>.home-collage-sentinel{grid-column:1/-1}
   .collage-sort{margin:0 0 32px 48px}
   .collage-sort-note{margin:0 48px 32px 0;padding:0;max-width:none;text-align:right;align-self:center}}`.
   Between 1100 and 1299 px the dashed lines show without their triples: show the triples from 1200 px
   if they clear the characters, otherwise hide the lines with them.
2. **Home, the wall at two sizes (CSS).** `.home-hero .hero-images{padding:0 48px;gap:16px;grid-auto-rows:clamp(150px,14vw,210px)}`;
   in Shuffle only (no group labels or swatches) tiles 13n+2 and 13n+9 span 2x2
   (`.hero-images:not(:has(.home-tile-label,.home-tile-swatch)) .home-tile:nth-child(13n+2), ...:nth-child(13n+9){grid-column:span 2;grid-row:span 2}`);
   phone: 3 columns, 8 px gaps, rows `calc((100vw - 48px)/3)`, padding 0 16px, tile 7n+1 spans 2x2;
   same at the 4-column breakpoint (980 px). The end: fade the last 320 px
   (`body.collage-done .home-hero .hero-images{mask-image:linear-gradient(#000 calc(100% - 320px),transparent)}`),
   `.collage-more{position:relative;margin-top:-96px;padding:0 16px 128px}`, `.collage-more a{font-size:1.25rem}`.
3. **Visualizations, alternate wide and split sections (CSS; bigger memes in JS).** Wide: time,
   popularity, D0, gallery, confidence, flow. Split (from 1100 px): platform-time, family, walk, with a
   360 px text column (group label, header, controls stacked) and the chart at full section height:
   `:is(#sec-platform-time,#sec-family,#sec-walk){display:grid;grid-template-columns:360px minmax(0,1fr);grid-template-rows:auto auto 1fr;column-gap:48px;align-content:start}`,
   `...>:is(.viz-group-label,.sec-header,.viz-controls){grid-column:1}`,
   `...>.graph-wrap{grid-column:2;grid-row:1/-1;min-height:0}`,
   `:is(#sec-family,#sec-walk)>.viz-controls{flex-direction:column;align-items:flex-start;padding-left:22px}`.
   Story stays split. Charts read their box size when they first draw (wrapSize in
   meme_viz_extra.js, getBoundingClientRect in meme_viz.js), so they fill the new boxes; test each width
   by loading at that width. JS: D0 thumbnails 48 to 64 px, family-tree variant circles 56 px, walk
   meme nodes 64 px.
4. **Visualizations, edges and alignment (CSS + JS).** `#app:not(.panel-open){padding-right:48px}`,
   `#sec-spectrum .graph-wrap-dark{margin-right:-48px}` (the one full-width image),
   `#sec-flow{margin-bottom:128px}`. JS: each chart's longest y label on the title edge (desktop margin
   objects in meme_viz.js around lines 650, 805, 929, 1280: left margins 100, 180, 72, 82); trim the
   66 to 70 px under the x axis in three charts and 174 px under D0.
5. **Visualizations, an opening and a hierarchy (markup + CSS).** Markup: an opener with the site's
   `meme-banner` (h1 "Visualizations" at clamp(2.4rem,5vw,3.6rem), the 14-meme strip, one sentence on
   what the eleven views cover, by writer-alice). CSS: `.viz-section+.viz-section{margin-top:96px}`,
   `.viz-section:has(>.viz-group-label):not(:first-of-type){margin-top:192px}`, `.sec-header{padding-top:32px}`;
   section titles clamp(2rem,2.8vw,2.5rem) with letter-spacing .01em; group label 16 px ink 600;
   header to controls or chart 32 px. Scale 58 / 40 / 24 / 16 / 14 / 12-13.
6. **One finding per chart (markup; copy by writer-alice from the data).** Under each title one
   finding (24 px, ink, 500, about 30 characters a line) and 3 or 4 meme thumbnails (64 px, linked);
   the encoding sentence moves under the chart as a 14 px grey "How to read" line. Models: Platform
   Story's chapter sentence and the Classifier readout. One claim per chart, no stat rows.
7. **Chart text (JS; CSS stopgap).** Chart text at least 12 px, ticks 13 px (inline sizes in
   meme_viz.js around 688-770, 869, 1066-1106, 1330). Size key fill #67625a. Gallery extent labels
   darker: 4caf50 to #2e7d32, ff9800 to #b45309, f44336 to #c62828, purple to #7b1fa2; same for
   `.fam-ring-label` at 12 px; `.fam-ring-label` and `.flow-stage` 12 px, no letter-spacing, sentence case.
8. **Phone.** CSS: home `.viz-section.home-hero{padding-top:calc(var(--nav-h) + 32px)!important}`
   (was + 4px); reset `#graph-variant-gallery` padding to 0 under 768 px. JS: the popularity, Sankey and
   temporal charts need a phone layout or a 640 px minimum in a sideways-scrolling box with a hint.
   Spacing: button to Arrange 64, Arrange to note 8, note to wall 24.
9. **The wall's images (repo).** All 360 tiles load from i.kym-cdn.com; after a slow scroll and 6 s,
   about 200 of 360 were still loading; the `images_flat/` fallback returns 404. Host small WebP
   thumbnails (420 px long side), first 12 with fetchpriority high; Know Your Meme stays the link;
   placeholder #ecebe6; about 160 tiles on phones.
10. **Side contents (CSS + markup).** `:root{--dot-nav-w:208px}`, labels 13 px,
    `.dot{padding:10px 16px 10px 24px;min-height:44px}`, "Contents" on the same 24 px edge. Markup:
    the 4 group names as 13 px grey headings (24 px above), label text inside each link.

## Keep
The hero as composed (centred Impact title, characters on the ground line, floating Me Gusta and
Trollface, hover reactions, the faint dashed graph with real triples); the wall and Arrange (four
orders, the reshuffle, the Impact group labels, RDF on hover); everything the first refine removed
and added; the Variant Gallery (the model for memes as material); the spectrum's dark canvas (the
only full-width image); Platform Story's chapters and the Classifier readout; Impact for titles.

## Target feel
The home page is a poster first, then a working wall: a centred title with its characters on the
ground line, a clear pause, then memes at two sizes with wide gutters and the Arrange controls on the
wall's own edge. The visualizations page reads as a sequence with a beat: wide charts alternate with
split sections where one finding and its memes sit beside the chart, the dark spectrum is the single
full-width image, and there is plenty of paper around everything.
