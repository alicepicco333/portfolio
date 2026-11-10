# The Stolen Archive: where each fix goes

Notes for fixing the findings in `audit.md`, from reading the site's code on 10 November 2026
(repo `C:\Users\awlic\Projects\Looted-items-collection`, `main` at `cf11f91`, the live site).
Work on a new branch `accessibility-fixes`; keep the original design (near-black, lilac #B7B5E4,
orange #FF4A1C, Karrik / Space Grotesk / Free Faces); do not edit the 85 photo descriptions
(A11Y-22, Alice reviews them). Leave the nested worktree
`.claude\worktrees\gallery-fix` and untracked folders such as `_tmp_identity\` alone; searches
will also match the old copies in that worktree.

| Finding | Where | Fix |
|---|---|---|
| O-1 tour buttons do nothing when the page was opened with `?tour=` | `object-page.js:252` `changeTour()` saves the tour, then `location.reload()`; `window.onload` (`object-page.js:527-536`) reads `?tour=` again and overwrites it | go to `Object-page.html?tour=<encoded>&length=<saved>&complexity=<saved>` instead of reloading |
| O-3 reading level reset | the same line passes `'short', 'fun'` every time; `site.js:47` does the same for "Start tour" | keep the saved length and level |
| O-2 address not updated | `displayItem` | `history.replaceState` with the current object |
| A11Y-07, A11Y-08 focus and announcements on object change | `aria-live` on `.object-text` (`Object-page.html:136`); Next / Previous / strip (`object-page.js:264-268`) | remove the live region; after a change move focus to `#item-title` (`tabindex="-1"`) so the object's name is read |
| A11Y-09 position only as a 3 px bar | `#tour-progress` (`Object-page.html:46-48`) | a visible "Stop n of N" in the site's mono style (the older `<strong id="tour-position">` in the gallery-fix copy is a model) and a track of at least 3:1 |
| A11Y-10 light-theme vermilion 4.17:1 | `--signal: #C9341A` at `site.css:76` | `#B82F17` (audit's suggestion; check 4.5:1 on the raised background) |
| A11Y-01, 02, 03 map focus, roles, Tab stops | Leaflet 1.7.1 from unpkg in `index.html` (lines 12, 195) and `atlas.html` (12, 178); markers with `keyboard: true` and only a `title` (`atlas-map.js:200`, `:216`); `#atlas-map` has `role="img"` (`index.html:106`, `atlas.html:56`) | restore the focus ring Leaflet removes (inline `outline: none`; pin Leaflet 1.9.x and/or CSS `:focus-visible` with `!important`), give markers a button role and a name, drop `role="img"` from the interactive map container |
| A11Y-11 endless motion | `.atlas-arc` (`site.css:754`), `.geo-map-arc` (`site.css:1165`); 3D auto-rotation in `viewer3d.js:52`; existing reduced-motion handling at `site.css:1683`, `viewer3d.js:52`, `viewer3d.js:199` | a pause control for the route animation and the rotation; nothing moving under `prefers-reduced-motion` |
| A11Y-18 contrast themes hide the selected tour, length and level | `@media (forced-colors: active)` block at `site.css:1695` | mark the selected state with a border or system colour that survives forced colours |
| A11Y-12 SVGs marked as images | `#floor-plan` (`atlas.html:80`), `#museum-map` (`Object-page.html:173`), the graph SVG built in `graph2d.js` | roles and names that match what is inside (links stay reachable) |
| A11Y-05 photo viewer leaks focus | `#imageModal` (`Object-page.html:292`), script `images-vis.js` | trap focus in the dialog, Esc closes, focus returns to the opener |

Verify against a local server (`python -m http.server 3003 --bind 127.0.0.1` in the repo):
rerun `scripts\run-axe.js` and the inspection scripts in this folder with `BASE` switched to
`http://127.0.0.1:3003/`, add an "After the fixes" section to `audit.md` (status per finding,
commit hash) and after-screenshots in `shots\after\`.

To publish once the branch is done:
`git switch main; git merge --ff-only accessibility-fixes; git push origin main` (in the repo).
