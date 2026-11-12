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
| `memo-refine.js` | Preview only: the markup and copy changes of the second pass, patched into the live pages after the site's scripts run (opener, findings, contents groups, copy). It stands in for repo changes; it is not meant to ship. |
| `findings.json` | One draft finding per chart, computed from the site's own data, with the memes that show it. For writer-alice. |
| `serve.js` | The preview at http://127.0.0.1:5192/: proxies the live site and adds the CSS and the JS layer (with `findings.json`) to every HTML page, read from disk on each request. `node serve.js` |
| `shots.js` | Regenerates every screenshot, with exactly what `serve.js` adds: `node shots.js` (both sets), `node shots.js before`, `node shots.js after home,thesis`. |
| `preview.js` | Older: a browser window with the stylesheet only (no JS layer). `Alt+Shift+R` compares with the live site. |
| `tools/findings.js` | Recomputes `findings.json` from the live data files. |
| `tools/check.js` | Through the preview, each page loaded fresh at 1440x900, 1280x800 and 390x844: console and network errors, text contrast, the first 14 tab stops, the review's spacing targets, and whether every chart drew. |
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

## Second pass: whitespace and a layout with a beat (design review 2, `CRITIC-2.md`)

Alice: "much better", but "not enough whitespace" and "the layout is not really visually interesting". Every
measurement now comes from one spacing scale: 4, 8, 16, 24, 32, 48, 64, 96, 128, 192.

### CSS (`memo-refine.css`)

| Where | Was | Now |
|---|---|---|
| Hero: title to tagline, tagline to button | 20, 20 | 24, 32 (`.hero-content` gap, `.hero-cta` margin-top 8); tagline balanced; title tracking .05em to .01em |
| Hero ground line to Arrange | 16 | 64 (`.hero-content` margin-bottom) |
| Arrange and its note, from 1100 px | centred, stacked, 2 apart | `.home-hero` becomes a grid: Arrange on the wall's left edge, the note on the same line at the wall's right edge, 32 to the wall |
| Wall | margins 28, gutters 10, rows 150 px, one size | margins 48, gutters 16, rows `clamp(150px, 14vw, 210px)`; in Shuffle tiles 13n+2 and 13n+9 are 2 x 2, so the wall has two scales (Year, Colour and Format stay a regular grid that reads in order) |
| Wall, 641 to 980 px | 4 columns, 8 gutters | 4 columns, margins 32, gutters 16, square rows, tile 7n+1 is 2 x 2 |
| Wall, phone | 2 columns, 6 gutters | 3 columns, gutters 8, margins 16, square rows `calc((100vw - 48px) / 3)`, tile 7n+1 is 2 x 2 |
| End of the wall | hard edge, link 88 below, 64 to the footer | the last 13 tiles stay single, so the wall ends on a full row (360 tiles fill 87 rows of 6, or 170 rows of 3, exactly); once all 360 are in (`body.collage-done`) the last 320 px fade out and the 20 px link moves up into the fade; 128 to the footer |
| Hero graph | 1100 to 1299 px: dashed lines without their triples | triples from 1200 px (they clear the characters there); 761 to 1199 px the graph is hidden |
| Phone home | bar to title 4, button to Arrange 95, note to wall 22 | 32, 64, 24 (Arrange to note 8) |
| Contents column | 164 px, 12.8 px labels | 208 px from 1025 px, 13 px labels, items 44 px or more, text on a 24 px edge |
| Sections | all exactly 852 px, rule-free but uniform | 96 px between sections, 192 before a new group, 32 to the first line, 32 from header to chart; sections grow to their content and charts get one height that follows the window (`clamp(480px, 100vh - 220px, 760px)`, split charts `clamp(560px, 100vh - 120px, 820px)`), so the findings do not squeeze them |
| Section titles, group labels | 32 px; 14 px grey | `clamp(2rem, 2.8vw, 2.5rem)` with .01em tracking; 16 px ink 600 |
| Right edge | charts ran to the window edge | 48 px margin from 1025 px; the colour spectrum alone bleeds to the edge (`margin-right: -48px`); 128 px under the last chart |
| Layout | every section wide | from 1100 px Platform x TimePeriod, Variant family tree and Knowledge-graph walk split: a 360 px text column beside a taller chart, alternating with the wide ones (Platform story was already split) |
| Chart text (stopgap) | 9 to 11 px, ticks 10 to 11 px, #bbb and #888 labels | ticks 13 px, all other chart text 12 px, size key and grey labels `--muted` (5.6:1); ring and stage labels without tracking |
| Extent label colours | #4caf50, #ff9800, #f44336 as text (2.0 to 3.4:1) | #2e7d32, #b45309, #c62828, #7b1fa2 (4.6:1 and up); the thumbnail frames keep the bright colours |
| Phone visualizations | gallery rows squeezed by 32 px padding | padding reset; 64 between sections, 96 before a group |
| Dropdown menu items | 33 px | 44 px |

### Markup layer (`memo-refine.js`, preview only)

Loaded by `serve.js` as `<script src="/__refine.js" defer>` after the stylesheet link, with `findings.json` in front of
it as `window.MEMO_REFINE_FINDINGS`. It runs after the site's own scripts and before the 12 MB data file arrives, so
the charts measure the new layout when they first draw. It never removes an element a site script looks up later, and
each patch is wrapped so a failure cannot stop the site. A MutationObserver (one pass per frame) repeats the copy fixes
on content the site builds later (about, dataset, chart labels, status lines, the Arrange note).

- **Opener** (visualizations): an `h1` "Visualizations" in the site's caption-banner pattern, with a strip of 14 memes
  from `memes_lite.json` (same filter as `memo_meme.js`) and one sentence (`findings.json` > `opener`, a draft).
- **One finding per chart**: under each title the draft fact (24 px, ink, 500, 30 characters a line) and 3 or 4 meme
  thumbnails (64 px, linked to their pages on the site). The encoding sentence moves under the chart as a 14 px grey
  "How to read" line (in the variant gallery it stays under the header: the gallery is 2,000 px tall). In split
  sections the text column holds group, title, finding, memes, controls and How to read.
- **Contents**: the four group names as 13 px grey headings (Global dataset, D0 sample, Variants, Interactive
  explorations), and each name inside its link instead of `::after`.
- **Copy**: ticker element removed (its script returns early when the element is missing); degree line moved after
  the byline; "~143" becomes "about 143"; " · " lists become sentences (Arrange notes in all four orders, walk hint,
  byline, degree line); em-dashes out of the SPARQL subtitle and status; sentence case for the labels listed below;
  no "1." to "8." on the example queries; Sankey stage and family-tree ring labels in sentence case, the family caption
  "ORIGINAL · ME AND THE BOYS" as "Original: Me And The Boys".
- **Phone**: Popularity x format, Temporal distribution and Property flow draw at 640 px inside a box that scrolls
  sideways (focusable, labelled "Chart, scrolls sideways"), with the hint "Scroll sideways to see the whole chart."

### `findings.json`

Written by `tools/findings.js` from `meme_data.json`, `sampled_dataset.json`, `transformation_annotations.json` and
`color_data.json`. Each entry: `sectionId`, `fact` (a draft sentence), `numbers` (exact values for writer-alice to use),
`memes` (`name`, `url`, `thumb`). Two of them repeat numbers the site already prints, and they match: Platform story
3,610 attributed memes peaking in 2019 with 505; Colour spectrum saturation 20% to 16%.

## For the repo session

The preview shows items 1 to 9; they still need to be made in the repository. Items 10 to 16 are not in the preview.

**Markup and copy**
1. **Visualizations opener**: `<header>` before the first section with the caption banner (`h1` "Visualizations",
   14-meme strip) and one sentence by writer-alice. Add `#mr-opener`-like markup to `visualizations.html`, or add the
   `h1` to `memo_meme.js`'s `BANNER_SELECTOR`.
2. **A finding per chart**: under each `h2`, one sentence by writer-alice from `findings.json`, with its 3 or 4 memes;
   the current `<p>` under each title moves under the chart, starting "How to read".
3. **Contents**: group headings in `#dot-nav`; each name inside its `<a class="dot">` (they are empty now, with the
   name in `::after`).
4. **Ticker**: delete `<div class="home-ticker">` and `buildTicker()` in `index.html`.
5. **Thesis title block**: `.th-kicker` after the byline; `<b>~143</b> min read` as `about <b>143</b> min read` (the
   tilde reads as a minus in Bricolage Grotesque).
6. **" · " lists and em-dashes**:
   - byline: "Alice Picco. Supervisor Fabio Vitali. Co-supervisors Tommaso Campagna, Carlo Teo Pedretti. Session I,
     A.Y. 2025–2026."
   - degree line: "Master's dissertation in Digital Humanities and Digital Knowledge, Università di Bologna."
   - the four Arrange notes (`NOTES` object in `index.html`): one sentence per part, e.g. "A random mix of memes and their
     variants. Hover a tile to read its RDF."
   - `.ds-ov-sub`: "Full meme collection from Know Your Meme".
   - `.editor-subtitle`: "Query the meme ontology with SPARQL 1.1 (local document stream)."; query status: "Ontology
     loaded, ready to parse queries".
   - `.walk-hint` (meme_viz_extra.js): "Click a meme to reveal its properties. Click a property to pull in more memes
     that share it. Drag to move. Ctrl/⌘ + scroll to zoom."
7. **Sentence case**: "Example queries", "At a glance", "Ontology structure", "Semantic interoperability", "Design
   principles", "Eight transformation dimensions", "Run query", "Data collection", "CLIP classification", "OWL
   generation", the dataset labels ("Global dataset", "D0 sample", "Variant dataset", "D0: annotated sample"), the
   group labels and the eleven contents names (the full map is `EXACT` in `memo-refine.js`).
8. **Example queries**: drop "1." to "8." (an `<ol>` keeps the order for screen readers).
9. **Chart labels in capitals**: in `meme_viz_extra.js` drop `.toUpperCase()` on the family ring labels (around line
   252) and the Sankey stages (around 1261); family caption `'ORIGINAL · ' + group.name` as `'Original: ' + group.name`
   (around 301).

**Charts (JS)**
10. **Chart text**: at least 12 px, ticks 13 px, set where the scripts set it (`meme_viz.js` around lines 688 to 770,
    869, 1066 to 1106, 1330: inline 9 to 11 px); size key fill #67625a instead of #bbb; label text in the darker
    extent colours (`EXTENT_COLOR` in `meme_viz.js` line 1134, and in `meme_viz_extra.js`), keeping the bright ones for
    frames and marks if wanted. The CSS stopgap can then go.
11. **Chart margins**: each chart's longest y label on the title edge (desktop margin objects in `meme_viz.js` around
    lines 650, 805, 929, 1280: left margins 100, 180, 72, 82); trim the 66 to 70 px under the x axis in three charts
    and the 174 px under the D0 chart (visible as empty paper under it in the shots).
12. **Bigger memes inside the charts**: D0 thumbnails 48 to 64 px, family-tree variant circles 56 px, walk meme nodes
    64 px.
13. **Phone layouts** for the popularity, Sankey and temporal charts. The preview's 640 px sideways box is a stopgap.
14. **Wall images** (finding 9): all 360 tiles load from i.kym-cdn.com and many are still loading after a slow scroll;
    the `images_flat/` fallback returns 404. Host 420 px WebP thumbnails, `fetchpriority="high"` on the first 12, keep
    Know Your Meme as the link, placeholder #ecebe6, about 160 tiles on phones.
15. **Section heights**: drop the fixed `height: calc(100vh - var(--nav-h))` on `.viz-section` and give each chart an
    explicit height, as the CSS does now.
16. **Merge, do not stack.** `meme_viz.css` is already seven layers deep, each overriding the last. Fold these changes
    into the rules they override and delete the dead ones, instead of adding another layer.
17. **A 404 on every visualizations view**: `cultural_reference_annotations.json` is requested first but only
    `cultural_reference_annotations(1).json` exists. Rename the file, or put the existing name first in `meme_viz.js`
    (around line 78).

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

Second pass, through the preview (`tools/check.js`), every page loaded fresh at 1440x900, 1280x800 and 390x844:
- **Charts**: all eleven draw, each at its new size (wide 1184 x 680, split 776 x 680 at 1440; on phones the three
  sideways charts at 640 px).
- **Errors**: no console errors from the refine layer. One 404 on every visualizations view comes from the site
  itself: `meme_viz.js` tries `cultural_reference_annotations.json` first, which does not exist on the live site
  (`cultural_reference_annotations(1).json` does). Rename the file or reorder the fallback list in the repo.
- **Contrast**: no text below AA. One old failure fixed in this pass: the SPARQL status "Ontology loaded" in #2e8b57
  (3.9:1), now #24734a (5.3:1).
- **Keyboard**: order is bar, dropdown, contents, then each section's meme links and chart controls; every stop shows
  the ring (chart nodes show it on their shape, as the site's own CSS does). Targets 44 px or more, except the thesis
  index links (27 to 29 px; 60 links, a 44 px row would make the index very long; still above the 24 px of WCAG 2.2).
- **Spacing**: the review's targets measure as asked: hero 24 / 32, ground line to Arrange 64, note to wall 32,
  wall margins 48 and gutters 16 (phone 16 and 8), sections 96 apart and 192 before a group, charts 48 px from the
  right edge, the spectrum at 0, contents 208 px wide; no horizontal overflow at any width.

## Findings copy (writer-alice, 12 Nov 2026)
The final sentences are in `findings.json` (`fact`, with the earlier draft kept as `draft`; the
opener's earlier text as `draftText`). Check before publishing: Platform Story says 3,610 of the
5,000 memes name their platform (so 1,390 without), but the Sankey data counts 1,346 "unattributed";
neither sentence uses the unattributed count, but `tools/findings.js` and the site's data should
agree. The Sankey value "TwitterX" is written "Twitter/X" in the sentence.
