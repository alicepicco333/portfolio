# The Meme Ontology: refinement, fewer separators and containers

A stylesheet of overrides for https://thememeontology.netlify.app/, not a redesign. Same pages, same sections in the
same order, same content, the same meme wall and hero characters, the same type families (Impact/Anton for titles,
Bricolage Grotesque for the interface, Newsreader for the thesis text, IBM Plex Mono for code and IRIs).

Brief, in Alice's words: "keep the meme wall and the structure, but the template looks quite AI and too many separators
and containers." So the work removes the kit that reads as AI-made: rules over and under every block, boxes around
every section and control, spaced-capitals labels, a ticker of counts, 01 to 11 numbers, pill groups. Space, alignment
and type size now do the grouping. Rules stay only where they carry structure.

## Files

| File | What it is |
|---|---|
| `memo-refine.css` | The override layer. Load it after `meme_viz.css` and after the inline `<style>` blocks of `thesis.html` and `sparql.html` (it wins by coming last, at the same specificity). |
| `shots.js` | Regenerates every screenshot: `node shots.js` (both sets), `node shots.js before`, `node shots.js after home,thesis`. |
| `preview.js` | Opens the live site in a browser window with the stylesheet on every page you visit. `Alt+Shift+R` switches it off and on to compare. `node preview.js` or `node preview.js thesis`. |
| `tools/audit.js` | Counts every visible border, shadow, decorative bar and spaced-capitals label per page (`-` for the site as it is, or a CSS path). |
| `tools/measure.js`, `tools/probe.js` | Alignment and chart-rendering checks used while building. |
| `shots/before/`, `shots/after/` | `<page>-1440x900.png` (first screen), `<page>-1440x900-full.png` (full page; the thesis is clipped to its first 12,000 px of about 111,000), `<page>-390x844.png` (phone first screen). |

Pages: `home`, `visualizations`, `thesis`, `sparql` (the four asked for), plus `dataset`, `ontology` and `about`, the
in-page views of the visualizations app, because they share the stylesheet and change with it.

## What the audit counts (desktop, whole page, live site vs live site with the override)

| Page | Visible borders | Spaced-capitals labels | Decorative bars | Notes on what is left |
|---|---|---|---|---|
| Home | 15 to 5 | 150 to 0 | 3 to 0 visible | the hero ground line, the two speech bubbles (shown on hover), the filled buttons (border = fill) |
| Visualizations | 107 to 58 | 64 to 0 | 13 to 0 visible | 55 of the 58 are the variant thumbnails' extent frames (data); the active contents marker; the loader |
| Thesis | 30 to 3 | 5 to 0 | 12 to 0 visible | the search field underline, the active index marker, the button fill |
| SPARQL | 31 to 3 | 7 to 0 | 2 to 0 visible | the editor underline, the button fill; the results table keeps its row rules when it has rows |

## Every change

Selectors are the site's own. "Why" names the rule from the brief it follows.

### Shared

| Selector | Was | Now | Why |
|---|---|---|---|
| `.viz-group-label`, `.panel-label`, `.viz-controls-label`, `.about-section h2`, `.detail-section-title`, `.stat-label`, `.pipeline-num`, `.vg-legend-title`, `.ds-ov-sub`, `.dot-nav::before`, `.collage-sort-title`, `.hero-cta`, `.transform-legend h3`, `.th-kicker`, `.th-toc-head`, `.sidebar-label`, `.ds-ov-go`, `.site-footer-col span`, `.collage-more a`, `.transform-legend-hint`, `.vg-ext-label`, `.story-step h3` and others | uppercase, tracked .06 to .16em, often 10 to 11 px | the markup's own case, no tracking, 13.6 to 16 px | spaced-capitals label strips are the most recognisable part of the kit; plain text is also easier to read |
| `:root` | | adds `--mr-line: #8a8378` (input underline, 3.4:1 on paper), `--mr-hover` (6% ink), `--mr-section: 56px`, `--mr-label: .9rem` | one value for each new decision |

### Top bar, footer, popovers (all pages)

| Selector | Was | Now | Why |
|---|---|---|---|
| `.topnav` | 1 px ink rule under the bar | no rule; a 12% hairline fades in only once content scrolls under the bar (scroll-linked, where supported) | the rule framed every page; the edge now appears only when it means something |
| `.topnav-link` | about 30 px tall | 44 px target, same look | usable targets |
| `.topnav-link.active::after` | 3 px bar hanging on the bar's rule | hidden; the current page is underlined (2 px, offset 7 px) | without the rule the bar had nothing to sit on |
| `.rm-btn` (Random meme) | bordered button | icon and label, no frame, 44 px; underline on hover | the only boxed item in the bar |
| `.rm-card` | ink frame, 4 px top bar, shadow | shadow only | one way to show elevation, not three |
| `.rm-again` | bordered button | underlined text (Open stays filled) | one filled action per card |
| `.topnav-dropdown-menu`, `.topnav-dropdown-divider` | frame + shadow, rules between groups | shadow, space between groups | |
| `.site-footer-col span` | spaced capitals | sentence case, 13.6 px | |
| `.site-footer-base` | rule above | no rule | the dark footer is already one block |

### Controls and fields (all pages)

| Selector | Was | Now | Why |
|---|---|---|---|
| `.viz-btn`, `.ds-vtoggle`, `.ds-page-btn` | bordered pills, the active one filled | text choices, 44 px; the current one ink, 600, underlined | "pill buttons in bordered groups" |
| `.onto-doc-btn`, `#btn-show-more`, `.panel-more button`, `.walk-card-actions a/button` | bordered pills, capitals | underlined text in ink, 44 px | actions read as links, without boxes |
| `.icon-btn`, `.zoom-tools button`, `.onto-graph-zoom button` | 28 px bordered squares | 44 px, no frame, hover tint | targets |
| `.dataset-search`, `.dataset-select`, `.viz-search input`, `.th-search input` | full frame in #bdb6a8 (1.85:1, too faint to find) | one underline in #8a8378 (3.4:1), 44 px, text starts on the line | a field still needs a visible boundary (WCAG 1.4.11), one line is enough |
| `.meme-thumb`, `.ds-card` | frame around each thumbnail, lift on hover | no frame, no lift; the name darkens on hover | the meme is the object |
| `.tag-pill`, `.onto-pill` | bordered pills | 6% ink ground, no border | |
| `.meme-page-img-col img`, `.detail-section-title` | frame; label with a rule | no frame; plain label | meme detail pages |

### Home

| Selector | Was | Now | Why |
|---|---|---|---|
| `.home-ticker` | a looping strip of format counts under the bar, with a rule (already `aria-hidden`) | hidden | "a ticker row of counts"; motion on loop that explains nothing; the counts live in the charts |
| `.home-hero`, `.viz-section.home-hero` (phone) | top padding made room for the ticker | 4 px under the bar | the hero moves up 28 px; more of the wall shows on the first screen |
| `.hero-graph text` | #8a8378 on paper, 3.4:1 at 11 px | `--muted`, 5.6:1 | AA contrast |
| `.home-hero .hero-cta` | capitals, tracked | sentence case, 16 px, 48 px tall | |
| `.collage-sort` (Arrange) | framed group of pills, ARRANGE in capitals | a line of text: Arrange, then Shuffle, Year, Colour, Format A to Z; the current one ink and underlined; 44 px targets | "pill buttons in bordered groups" |
| `.collage-more` | rule above, capitals link with a border underline | no rule, a 17 px underlined link | |

### Visualizations

| Selector | Was | Now | Why |
|---|---|---|---|
| `.dot-nav` | rule on its right, CONTENTS with a rule under it | no rules; "Contents" in plain text | |
| `.dot::before` | 01 to 11 numbers | removed | numbered kickers; the order is visible anyway |
| `.dot`, `.dot.active` | 3 px bar for the current section, 9 px padding | 2 px ink marker; 14 px padding, so one-line items are 44 px and the space between labels is even | keeps a "you are here" mark without a box |
| `.viz-section` | rule under every section | none | |
| `.viz-group-label` | a capitals strip with its own ground and rule | plain 14 px text in grey, 56 px of space above it | strip and rule removed; the label itself is content (see markup changes) |
| `.sec-header` | a 72 px band with its own ground and a rule, title and sentence side by side | no band, no rule; title above its sentence, 56 px of space above | "rules over and under every block", "lead in column 2" |
| `.sec-header h2::after` | 4 px bar under every title | removed | |
| `.sec-header h2`, `.sec-header p` | 28 px, 12.8 px | 32 px, 15 px, at most 72 characters a line | type size does the grouping |
| `.graph-wrap` | a lighter box behind every chart | the page ground | the chart sits on the page; the colour field keeps its dark canvas |
| `.viz-controls` | a band with a rule | no band; buttons start on the title's edge | |
| `.transform-legend` | framed box, capitals title | a heading and an underlined "Show explanations" | |
| `.legend-item` | grey ground, ink bar on the left | plain term (mono, it is an ontology term) and description | |
| `.vg-legend`, `.vg-row` | rule under the legend and under every template row | space (28 px each side) | |
| `#graph-variant-gallery` | rows 8 px left of the titles | rows on the title's edge | alignment does the grouping |
| `.walk-step`, `.walk-step-prop` | bordered pills, the property filled | text with its arrows, the property in 600 ink | |
| `.walk-card` | frame + shadow | shadow only | |
| `.story-step` | framed card with a bar | text beside the chart, the current chapter at full strength (unchanged); on phones it keeps a light ground and a shadow because it scrolls over the chart | |
| `.node-panel`, `.panel-top` | ink rule on its left edge, rule under its head | an edge by shadow, no inner rule | |

### Dataset, about and ontology views

| Selector | Was | Now | Why |
|---|---|---|---|
| `.ds-overview-card` | three framed cards with a 4 px bar, lift on hover | three open columns; "Browse" underlined, thicker on hover | stat cards between rules |
| `.ds-sec-title` | marker highlight under the title | none | |
| `.ds-section` | rule above each section | 72 px of space | |
| `.about-stats`, `.stat-card` | framed row, rules between, 4 px bars, centred | open row, left aligned; 2 columns on phones (4 columns ran off a 390 px screen) | stat row between rules |
| `.about-pipeline`, `.pipeline-step` | framed row, rules between, 4 px bars | open columns, 32 px apart | |
| `.about-section h2` | capitals label with a rule | 18 px heading, no rule | |
| `.onto-doc-header` | a band with its own ground and rule, text at 18 px from the edge | no band; aligned with the graph's text | |
| `.onto-graph`, `.onto-graph svg` | frame, plus a rule above the drawing | no frame; the drawing keeps its lighter surface so you can see where dragging works | |
| `.onto-doc-nav`, `.onto-doc-sec h2`, `.onto-entity-block`, `.onto-card`, `.onto-stat-card`, `.onto-doc-disclaimer` | rules, frames, side bars | none | the entity tables keep their rules |

### Thesis

| Selector | Was | Now | Why |
|---|---|---|---|
| `.th-toc` | its own ground and a rule on its right | one reading surface, no rule | |
| `.th-toc-head`, `.toc-ch > a` | Impact capitals for "Index" and each of the nine chapters | the interface face, 600, the markup's case | Impact was shouting nine times in a sidebar; the site's own rule keeps Impact for display titles |
| `.th-toc-list a.active` | 2 px marker | unchanged | state |
| `.th-search input` | full frame | one underline (3.4:1) | |
| `.th-title` | rule under the title block | none, 64 px of space | |
| `.th-kicker` | a capitals label strip above the title, with dot separators | moved under the byline (CSS `order`), plain grey text | an eyebrow above a heading; nothing sits above the title now |
| `.th-title p` (byline) | Newsreader italic, grey | the interface face, ink | metadata, not reading text |
| `.th-meta` | 12.8 px, bold figures | 14.4 px, figures 500 | a quiet line, not a stat row |
| `.th-body h2` | rule above each chapter and a 5 px bar under each title | 128 px of space; the Impact title marks the break | |
| `.th-body figure img`, `.th-body pre` | frame; frame and a left bar | none; the code ground stays | |
| `.pg` (printed page numbers) | #a39a8b, 2.8:1 | `--muted`, 6:1 | AA contrast |
| `.th-toc-toggle` (phone) | mono capitals | 14.4 px sentence case, 44 px | |
| `.th-top` | framed 38 px square | 44 px, light ground with a shadow (it floats over text) | |

### SPARQL

| Selector | Was | Now | Why |
|---|---|---|---|
| `.sparql-sidebar`, `.sidebar-section` | its own ground, a rule on its right, rules between sections | no rules; 340 px wide on screens of 1200 px and up so most prefixes fit one line | |
| `.ns-pill` | eight framed boxes | a list; a long IRI wraps and hangs under its prefix | |
| `.example-btn` | ten framed cards with a left bar | a list of choices; hover tint; 44 px and more | |
| `.editor-topbar .meme-banner` | title and memes 18 px in from the editor's edge | on the edge, 10 px above the subtitle | alignment |
| `.editor-subtitle` | 10.9 px | 14.4 px | |
| `.sparql-textarea` | ink frame | a light ground and one underline (3.4:1) | the editor is still clearly the field |
| `.run-btn` | mono capitals | 15 px sentence case, 44 px, still filled | the one primary action |
| `.clear-btn` | framed | underlined text | |
| `.sparql-results`, `.results-count` | frame around an empty box | no frame; "Run a query to see results" sits under the controls | |
| `.results-table th` | capitals | the variable names as written | `?format` is not a label |

## What CSS cannot do: markup changes for the repo session

1. **Reading time.** `thesis.html`: `<b>~143</b> min read`. In Bricolage Grotesque the tilde is flat and reads as a minus
   ("-143 min read"). Write `about 143 min read`, or `143 min read`.
2. **Group labels on the visualizations page.** "Global Dataset Visualizations", "D0 Visualization", "Variant
   Visualization", "Interactive Explorations" still sit above the first section title of each group, as quiet text.
   Better: make them group headings inside the side contents (`#dot-nav`) and remove them from the sections. If they
   stay, sentence case: "Global dataset", "D0 sample", "Variants", "Interactive explorations".
3. **Contents links have no text.** Each `<a class="dot">` is empty and shows its name through `::after
   { content: attr(data-label) }`. Put the name inside the link and drop the `::after`.
4. **Ticker.** Delete `<div class="home-ticker">` and the script that fills it (it is hidden by the CSS now).
5. **Degree line.** Move `<div class="th-kicker">` after the byline in `thesis.html`, so the reading order matches
   what is shown (the CSS moves it visually with `order`).
6. **Dot separators in text.** CSS cannot remove the " · " inside sentences. Suggested rewrites:
   - byline: "Alice Picco. Supervisor: Fabio Vitali. Co-supervisors: Tommaso Campagna, Carlo Teo Pedretti. Session I,
     academic year 2025–2026."
   - degree line: "Master's dissertation in Digital Humanities and Digital Knowledge, Università di Bologna."
   - `collage-sort-note`: "A random mix of memes and their variants. Hover a tile to read its RDF."
   - `.ds-ov-sub`: "Full meme collection from Know Your Meme".
   - `.editor-subtitle` and the query status: drop the em-dashes ("Query the meme ontology — Local Document Stream ·
     SPARQL 1.1", "Ontology loaded — ready to parse queries").
   - `.walk-hint`: four instructions joined by dots; make them two short sentences.
7. **Title case to sentence case.** With the capitals transform gone, the markup's case shows: "Example Queries", "At a
   Glance", "Ontology Structure", "Semantic Interoperability", "Design Principles", "Eight Transformation Dimensions",
   "Run Query". Sentence case reads calmer.
8. **Numbers in labels.** The example queries are titled "1. Japan + ImageMacro" and so on; drop the numbers (an `<ol>`
   keeps the order for screen readers). The pipeline's "01" to "04" can stay, the order is the content there, or
   become an `<ol>` too.
9. **Merge, do not stack.** `meme_viz.css` is already seven layers deep ("caption", "palette", "one accent",
   "readability", "light and consistent", "rail and character", "hero" passes), each overriding the last. When this is
   adopted, fold the changes into the rules they override and delete the dead ones, instead of adding an eighth layer.

## Deliberately kept

- **The meme wall, the Arrange interaction, the tile group labels** (ink box with Impact text) and the hero characters
  with their hover reactions and speech bubbles.
- **The hero ground line** under the characters: it is the floor they stand on and it hides their cut-off edges.
- **The faint graph from the title to the characters** with its triples ("hasFormat · Parody"): data, now readable.
- **Rules that carry structure**: the SPARQL results table and the ontology entity tables; the thesis reading-progress
  bar; the input underlines.
- **The variant gallery's coloured frames**: they encode transformation extent, so they are data, not decoration. (A
  separate question: the green, orange and red are a traffic light; a single-hue scale would read as "more change"
  rather than "good or bad".)
- **Drawing surfaces**: the colour spectrum's dark canvas and the ontology graph's lighter surface.
- **Type families**: Impact/Anton for titles, Bricolage Grotesque for the interface, Newsreader for the thesis text,
  IBM Plex Mono for code, IRIs and ontology terms. Only the byline moved from Newsreader italic to the interface face.
  Newsreader stays for 32,000 words of reading; if it should go, one line switches the thesis body to IBM Plex Sans,
  already loaded: `.th-body { font-family: 'IBM Plex Sans', system-ui, sans-serif; }`.
- **Colours**: paper, ink, the muted grey; no new colour.
- **One filled button per place**: "Explore the visualizations", "Run query", "Open" in the random meme card.
- **Chart internals**: axes, labels and marks inside the SVGs are unchanged. The family tree still sets its ring
  labels and centre caption in spaced capitals ("ORIGINAL · ME AND THE BOYS"); that belongs to a pass on the charts.
- **Motion**: nothing added except the scroll-linked hairline under the bar, which shows a state (content is under
  the bar). The site's reduced-motion rule still applies to everything.

## Checks

- Contrast: every text colour used is 4.5:1 or more on its ground (muted #67625a is 5.6:1 on paper, 6.0:1 on the
  reading surface); input underlines are 3.4:1 and 3.7:1. Two old failures fixed: printed page numbers (2.8:1) and the
  hero triples (3.4:1 at 11 px).
- Focus: the site's own ring (2 px ink, offset 2 px) shows on every control, framed or not.
- Targets: navigation, Arrange, toggles, actions, zoom buttons, the thesis and SPARQL buttons are 44 px tall or more.
- Phone (390 px): checked on every page; the about stats now fit (2 columns).
- `impeccable detect` on `memo-refine.css`: no findings.
