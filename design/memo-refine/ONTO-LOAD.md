# The ontology view loads oddly: what happens and the fix

Measured 12 Nov 2026 on thememeontology.netlify.app/visualizations.html#ontology (1440 x 900, Playwright,
frames from 0.4 s to 11 s), and on the refine branch (worktree `.claude/worktrees/refine-2026-11`) served
locally. Work for the Meme Ontology repo; nothing here edits it.

## What happens on the live site

1. **About 10 s of a blank "Loading meme data..." screen.** The boot `Promise.all` in `meme_viz.js` waits for
   `meme_data.json` (2.8 MB compressed, 7.8 s to download) before any route is shown. The ontology page does
   not use it: the graph needs `onto_graph.json` (4.7 KB, 0.25 s) and the documentation needs the OWL file.
2. **The graph moves around after it appears.** Live `onto_graph.js` draws on every simulation tick, so the
   classes drift for several seconds (MemeConcept moves about 250 px between 0.8 s and 6 s) and settle with
   overlapping labels (ComicBook and Book, ImageManipulationFormat and AudioFormat) and TransformationDimension
   cut off at the right edge.
3. **About 12 MB of full-size meme images download behind the ontology page.** `buildHero()` runs at every
   boot and fills the home wall with 200 random memes from `i.kym-cdn.com/entries/icons/original/...` (up to
   1.5 MB each), though the wall is not on screen. On the refine branch it is 21 MB over 100 requests.
4. One 404: `cultural_reference_annotations.json`, the first of three fallback names.

## Already fixed on the refine branch (not deployed)

- 2: the layout is worked out before anything is drawn and fitted to the box once; frames at 0.3 s and 6 s
  are identical.
- 4: the fallback order asks for `cultural_reference_annotations(1).json` first.

## Still to do

a. **Show pages that need no dataset at once.** Route `#ontology`, `#about` and `#disclaimer` before the data
   arrives and without the loader; load the dataset in the background and keep the loader only for the data
   views (and for a meme, D0 or variant page opened directly).
b. **Build the home wall only when home is shown, from thumbnails.** Call `buildHero()` from the route that
   shows it, and point the wall at small thumbnails instead of `/entries/icons/original/`.
c. **Keep labels readable in the graph.** Links and individual dots still run through words (TransformationDimension,
   OriginPlatform, MemeFormat, TextFormat). Give the label text a halo in the graph's ground colour
   (`paint-order: stroke; stroke: <ground>; stroke-width: 3px; stroke-linejoin: round`) so lines pass under them.
d. **Deploy the refine branch** so the live graph stops drifting.

## How to check

Film the load on the deploy preview (screenshots at 0.4, 0.9, 1.5, 2.5, 4, 7, 11 s): the graph should be
there, still and whole, within about 1.5 s; no request to `/entries/icons/original/` while on `#ontology`;
no 404s.
