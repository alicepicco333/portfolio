# The Meme Ontology: three redesign directions

Mockups for a redesign of https://thememeontology.netlify.app/. Nothing here touches the live site or its repository.
Each direction has a home page (first screen) and one inner page, built as static HTML with the real data of the site
(5,000 corpus entries with their average colours, the 5 templates and their 50 annotated variants, section 2.3 of the
thesis). Open them at http://127.0.0.1:5191/ while the static server runs.

## What the current site does well, and what feels generic

- Works: the home wall of real memes that can be rearranged, the RDF tooltip on hover, the thesis reader with search and
  printed page numbers, the SPARQL explorer, the variant gallery and family tree.
- Generic or off: Impact/Anton titles plus Newsreader serif body on warm paper (a "meme site" costume over a thesis look);
  a looping format ticker; joke speech bubbles on the hero characters ("such ontology"); default pastel D3 colours;
  traffic-light borders (green, orange, red) for transformation extent; a dashboard-style contents rail on the
  visualizations page. The thesis reader also shows "-143 min read" under the title.

None of the three directions uses the editorial-data kit (mono label line, giant headline, lead in column 2, stat row).
Each first screen fails the swap test on purpose: hide the title and it can only be this project.

---

## A. Swipe: every variant held against its template

**Idea.** The thesis's own contribution is the transformation typology: how and how far a variant departs from its
template. Direction A makes that comparison the site's main gesture. The home page opens on a template and one of its
variants in an image comparator (Swipe, Difference, Side by side), with the annotation beside it: which of the eight
dimensions the variant changes, its extent, the triple, and what CLIP read. Below, the template's ten annotated
variants in order from least to most change. The Difference view is an instrument as well as a picture: overlaying
"fonks" on Stonks lights up the head and the caption, while the annotation records only MediumShift. The site lets a
reader check the hand annotation.

- **Type.** Host Grotesk (UI, headings, reading) and Geist Mono (triples, counts).
- **Colour.** Cool light paper `#F4F5F6`, ink `#121316`, one accent: magenta `#D4007A` for "what changed". Extent is
  one magenta ramp (Minimal light, Moderate mid, Substantial full); Parody is a dashed outline because the thesis
  defines it as a different relation, not a bigger change. This replaces the green/orange/red borders.
- **Home.** Template tabs (Stonks, Surprised Pikachu, Me And The Boys, NPC Wojak, Change My Mind), comparator, variant
  strip, annotation record. Only 11 of the 50 variants share their template's frame (computed in
  `_tools/align.py`); those get Swipe and Difference, the others fall back to Side by side with a one-line reason.
- **Visualization page.** `variants.html`: a matrix with one column per variant and one row per dimension, with joined
  marks for variants that change several things (the multi-valued property made visible). Empty rows stay in:
  VisualSubstrate, LanguageShift and Localization are asserted for none of the 50, and no variant is Parody.
- **Thesis reader.** Same light page, Host Grotesk at 18px. When a paragraph names a template or a dimension, the
  margin shows the template and its variant strip, so the text can be checked against the images.
- **Phone.** One column: headline, tabs, comparator (drag with a finger), mode switch, scrollable strip, record. The
  matrix becomes one row per variant with its dimensions as chips.
- **Reduced motion.** The swipe follows the finger or the arrow keys (it is direct manipulation, not animation);
  crossfades and highlight transitions are off. Keyboard: the divider is a slider (arrow keys, Shift for 10%,
  Home/End).
- **Risk.** It leads with 5 templates and 50 variants, 1% of the corpus; the 5,000 entries live one level down.

## B. One square per meme

**Idea.** Cultural analytics at the scale of the corpus. All 5,000 entries are drawn as squares in their average
colour (real values from the site's colour data), and every view is made of the same squares: the home page, the
time chart, the format and platform views. When a view changes, the squares move from where they were to where they
belong, so the motion is the data being regrouped. Selecting a square opens the meme itself (close reading next to
distant reading).

- **Type.** Archivo (variable width: expanded for headings, normal for text) and Martian Mono for values.
- **Colour.** Near-black `#0C0C0E` with `#ECECEE` text and `#A1A1A8` secondary; no accent. The memes' own colours are
  the only colour, as in Manovich's image plots, which the thesis method follows.
- **Home.** Headline, Arrange control (Year, Colour, Format, Platform), the 5,000-square field with a year axis, and an
  entry panel (Me Gusta: image, year, formats, platform, views, CLIP label, average colour, Open entry, SPARQL).
- **Visualization page.** `time.html`: when the 5,000 memes appeared, one column per year, one square per meme.
  Choosing a platform or a format drops its memes to the bottom of every column (TikTok: 645 memes, most from 2022),
  with a note that Know Your Meme origin years can precede the platform.
- **Thesis reader.** A light reading surface inside the dark site, with a small corpus map in the margin lighting the
  squares the current paragraph talks about.
- **Phone.** The field becomes 70 columns of 5px squares; tap opens a sheet with the entry. The time chart turns
  sideways: one row per year.
- **Reduced motion.** Rearranging jumps to the new layout instead of moving the squares. Keyboard: arrow keys move
  between squares, Enter opens one.
- **Risk.** Most average colours are grey-brown, so the field reads as texture before it reads as memes; the first
  screen shows only one meme image. It is also closest to the existing Colour Spectrum view.

## C. Five levels: idea, template, variant, file, copy

**Idea.** The ontology's structure, made physical. One meme (Stonks) is taken apart into the levels MEMO separates:
Idea (MemeIdea), Work (MemeConcept, the template), Expression (the canonical image and its VariantInstances),
Manifestation (the JPEG, 792 x 446, kept as `dcterms:format`) and Item (the copy at its URL, scraped 2026-04-28, kept
as properties). Manifestation and Item are drawn dashed because MEMO records them as properties, not classes. Picking
a level lifts it and steps back the levels above; the readout says what MEMO records there, with a triple.

- **Type.** Schibsted Grotesk (heavy headings, long reading) and Spline Sans Mono.
- **Colour.** Committed: chroma-key green `#00B140` carries the stage (the green screen, the device that keeps a frame
  and swaps what is in it, is the Work and Expression idea in production terms), ink `#0B0F0C` text on it (6.8:1),
  cool paper `#F3F5F3` for reading.
- **Home.** Left: headline, lead, the five levels as a list (the selected one opens with its readout). Right: the green
  stage with the stack. In the build, the stack is an R3F scene that separates on arrival.
- **Visualization page.** The family tree would sit on the same stage: the Work in the middle, variants as planes
  around it at the distance of their extent.
- **Thesis reader.** `thesis.html`: index with search, the reading column, and a margin that maps the thesis's terms
  to the ontology (Work: `memo:MemeConcept`, Manifestation: `dcterms:format`, page numbers of the printed edition). The
  index ends with this copy of the thesis described in FRBR terms.
- **Phone.** Headline first, then a shorter green stage with a compact stack, then the levels list with its readout.
- **Reduced motion.** The stack is shown already separated; choosing a level changes it without movement.
- **Risk.** The green field is loud and the isometric layer stack is a common motif in product marketing; it
  explains one meme beautifully and says little about the corpus. Needs WebGL for the build.

---

## Recommendation

**A, Swipe.** It is the only direction whose first screen is the thesis's main original contribution, shown with the
memes themselves at research-object size. It is a working instrument rather than an illustration: the Difference view
already surfaced a case ("fonks") where the image shows a caption change the annotation does not record, which is
exactly the kind of checkable claim the project is about. It is light and readable for the thesis, needs no WebGL, and
carries the least risk of looking like a costume.

Two structures from the other directions fit inside A's look without changing it: B's unit chart (one square per
meme) for the corpus pages, and C's thesis margin that maps the text's terms to ontology classes and printed pages.

## Notes

- Images: real Know Your Meme images from the site's own data, shown small and credited as research objects. No
  invented memes. Change My Mind (a real person) is kept to a tab, not the hero.
- Quoted thesis text in C has three em-dashes replaced (a colon twice, parentheses once) to follow the no-em-dash rule
  for these mockups; the published thesis is unchanged.
- Triples shown use IRIs and properties found in the thesis or the site's data (`memo:photo_...`,
  `memo:hasTransformationDimension`, `memo:hasTransformationExtent`, `wdp:P361`, `dcterms:format`,
  `memo:imageFilename`). `memo:JPEG` as the FileFormat individual is assumed from the data value and should be checked
  against the OWL file.
- Fonts load from Google Fonts in the mockups; the build would self-host them.
- Performance (headless Chromium on this laptop, 1440 x 900): B's rearrangement of 5,000 squares and A's swipe drag
  both ran at 16.3 ms per frame on average, none over 20 ms.
- Rebuild: `python -I _tools/prep.py <live-data-dir> assets`, `python -I _tools/align.py assets`, then with the server
  up `node _tools/shots.js`.

## Files

- `A/index.html`, `A/variants.html`, `A/shots/` (plus `home-difference-1440x900.png`)
- `B/index.html`, `B/time.html`, `B/shots/`
- `C/index.html`, `C/thesis.html`, `C/shots/`
- `assets/` data and images shared by all three; `_tools/` the scripts that made them
