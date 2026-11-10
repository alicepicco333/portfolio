# The Stolen Archive: WCAG 2.1 AA accessibility audit (DRAFT)

**Status: draft. Not finished work.** The automated checks and the inspection checks below were done by Claude (research partner) on 10 November 2026. The screen reader passes, a real keyboard pass, a check in a real Windows contrast theme, the review of the photo descriptions and the walkthrough with readers have **not** been done. Do not present this as a completed audit until Alice has done the checks in section 7 and updated the findings with what they found.

- Site: https://alicepicco333.github.io/the-stolen-archive/ (static site on GitHub Pages; files tested were last modified 29 October 2026, 19:33 GMT)
- Standard: WCAG 2.1, Level A and AA
- Nothing on the site or in its repository was changed. No issues were filed. Nothing was published.

Every finding says how it was found:

- **Automated**: axe-core reported it.
- **Inspection**: Claude found it with scripted browser checks (simulated keys and mouse, computed styles, the browser's accessibility tree, layout measurements) or by reading the site's code.
- **Human check needed**: only a person with real assistive technology, a real keyboard or real readers can confirm it (section 7).

---

## 1. Scope and sample

| # | Page state | Address (after the site address) | Why it is in the sample |
|---|---|---|---|
| 1 | Home | `index.html` | Entry page: eras timeline (tabs), world map, moving list of objects, tours |
| 2 | Collection, grid view | `collection.html` | Region filters, view switch, 30 cards |
| 3 | Collection, index view | `collection.html` (Index pressed) | Data table |
| 4 | Tours | `tours.html` | Reading preferences (length, complexity), three tours |
| 5 | Atlas, floor 1 | `atlas.html` | World map, route list, floor plan, room list |
| 6 | Atlas, floor 2 | `atlas.html` (Floor 2 selected) | Second floor plan |
| 7 | Tour step 1 | `Object-page.html?tour=Timeline%20Tour&length=short&complexity=fun` | The state "Start the tour" opens |
| 8 | Object 001 Benin Bronzes | `Object-page.html?no=1&tour=Timeline%20Tour&length=short&complexity=fun` | 3D scan, floor 1 |
| 9 | Object 008 Throne of King Glele | `Object-page.html?no=8&tour=Colonial%20Conquests%20Tour&length=medium&complexity=basic` | Photos only, returned object, photo viewer |
| 10 | Object 024 Kalaniʻōpuʻu's Cloak and Helmet | `Object-page.html?no=24&tour=Geo%20Tour&length=long&complexity=expert` | Floor 2, longest text level |
| 11 | About | `about.html` | Team, contact |
| 12 | Documentation, all sections open | `documentation.html` | Long text page, tables, code |

Every object page also holds a floor plan ("In the museum"), a world map ("In the world") and the RDF knowledge graph ("The record"). The eras timeline is on Home; there is no separate timeline page.

Not in scope: the other 27 object pages (same template; their texts and photo descriptions differ), external sites the pages link to, the GitHub repository.

## 2. Method

**Date:** 10 November 2026.

**Tools and versions**

| Tool | Version | Use |
|---|---|---|
| axe-core | 4.13.0 | Automated rules. The brief suggested the CDN build 4.10.2; the local npm copy 4.13.0 (a newer release of the same rule engine) was injected from file instead, so no CDN request was made. |
| Playwright | 1.48.2 | Browser automation |
| Chromium (headless) | 130.0.6723.31 | Browser for all checks |
| Node.js | 22.16.0 | Scripts |

Requests used the plain User-Agent `a11y-audit-script`. No personal data was sent.

**Automated:** axe with the tags wcag2a, wcag2aa, wcag21a, wcag21aa and best-practice, on the 12 page states in the dark theme (default) and in the light theme: 24 runs at 1280 x 900 px. Each page was scrolled to the end first, so the sections that fade in were visible. Raw output: `axe-results.json` (violations and "incomplete" results in full; passed and not-applicable rules as rule ids).

**Inspection (scripted in the browser):**

- Simulated keyboard: Tab through Home, Collection, Atlas, object 001 and Tours to the end, recording each focused element, its focus style and whether something covers it; skip link; tabs with arrow keys; map markers; photo viewer; graph pop-up; Next object; numbered strip; menu at 375 px.
- Accessibility tree: Chromium's tree through Playwright and the DevTools protocol (role, name, state).
- Structure on 8 pages: headings, landmarks, image alt text, control names and states, live regions, dialogs.
- Contrast: the theme colours in `site.css`, computed with the WCAG formula; non-text contrast of the focus ring, progress bar, floor plan dots and map lines.
- Reflow at 320 x 640 px; 200% zoom simulated as 640 x 450 px at 2x; the text spacing values of 1.4.12; detection of cut-off text.
- Motion: running animations with and without the reduced-motion setting (emulated); 3D rotation by comparing two frames.
- Forced colours (emulated in Chromium), as a first look at Windows contrast themes.
- Links: 49 internal link targets and images in the sample, requested once each.

Raw inspection data: `inspection-results.json`. Scripts: `scripts/` (run them again after fixes; each takes the folder with Playwright and axe-core as its first argument; the one used was the temporary folder `C:\Users\awlic\.claude\jobs\b08852a3\tmp\node_modules`).

**What axe could not decide.** In the dark theme axe left 496 colour contrast checks as "incomplete": 358 for text over images (the wax seals on the collection cards), 34 for seal text that overlaps other elements, 28 for legends and room numbers overlapped by maps, 54 for arrows and plus/minus signs (not text), 17 for outlined decorative text that is hidden from assistive technology (exempt) and 5 for era tab dates over a pseudo-element. The light theme gave the same pattern. The ones that matter are in the manual checklist (D3).

**Limits.** One browser engine (Chromium) only; no Firefox, Safari or real phones. Simulated key presses are not a real keyboard pass. No screen reader was used. Emulated forced colours are not the same as a Windows contrast theme. Automated tools find only part of WCAG issues; on this site most findings came from inspection.

**Severity scale**

- **Blocker:** stops people from doing a core task (start a tour, read an object, find where it is) with no workaround.
- **Serious:** a core task is very hard for a group of people, and the way around it is not obvious.
- **Moderate:** a real barrier or failure, with a workaround on the same page or in a secondary feature.
- **Minor:** a small failure on a secondary page, or a best practice.

## 3. Summary

22 findings: **0 blocker, 3 serious, 11 moderate, 8 minor.**

- 14 are WCAG 2.1 A or AA failures measured in the browser (2 of them still need a person to confirm the effect: A11Y-11, A11Y-12).
- 7 are best practice or go beyond WCAG 2.1 AA (A11Y-03, 08, 17, 18, 19, 20, 21).
- 1 depends on a human review (A11Y-22, photo descriptions).
- 5 findings came from axe (A11Y-02, 10, 12, 16, 17); the other 17 came from inspection only.

The five most important:

1. **A11Y-01 (serious):** no visible focus anywhere in the world maps on Home and Atlas, across 47 Tab stops.
2. **A11Y-05 (serious):** focus leaves the full-screen photo viewer and moves to links hidden behind it.
3. **A11Y-02 (serious):** map markers can be focused and opened, but have no role for screen readers and sit inside an element marked as an image.
4. **A11Y-08 (moderate, core tour flow):** after Next, screen readers read the whole new text but not the object's name.
5. **A11Y-09 (moderate, core tour flow):** the position in the tour is a faint 3 px bar with no number on screen.

There are also 4 non-WCAG issues (section 5), one of them a functional bug: the tour switch does nothing when the object page was opened from a link that names a tour.

## 4. Findings

| ID | Page | WCAG success criterion | Severity | What happens | How found | Suggested fix |
|---|---|---|---|---|---|---|
| A11Y-01 | Home, Atlas (world map) | 2.4.7 Focus Visible (AA). Failure | Serious | When you Tab into the world map, none of its 47 stops (map area, 30 origin markers, 14 holder markers, 2 zoom buttons) shows a focus indicator. Leaflet 1.7.1 sets an inline `outline: none` on the element that gets a mouse-down or key event (its `preventOutline`), including the keyup of the Tab press that moved focus there; the inline style overrides the site's 3 px focus ring. Sighted keyboard users lose track of where they are for 47 Tab presses. | Inspection: simulated Tab walk with computed styles (`inspection-results.json`, keyboard.tab-home and tab-atlas); Leaflet 1.7.1 source; close-ups `shots/F-map-marker-unfocused-closeup.png` and `shots/F-map-marker-focused-closeup.png` look the same. | Preferred: see A11Y-03 (markers out of the Tab order). Otherwise upgrade Leaflet to a current 1.9.x release and test again; if the ring is still missing, add `outline: 3px solid var(--signal) !important` to the `:focus-visible` rules for `.leaflet-container`, `.atlas-origin`, `.atlas-holder` and `.leaflet-control-zoom a`. |
| A11Y-02 | Home, Atlas (world map) | 4.1.2 Name, Role, Value (A); 1.3.1 Info and Relationships (A). Failure | Serious | Map markers are focusable `div`s (`tabindex="0"`) named only by a `title`. Chromium exposes them with the role "generic". Enter opens the object page, but a screen reader does not say they are links or buttons. They sit inside a container with `role="img"`, whose children screen readers may not present at all. | Automated: axe `nested-interactive` on `#atlas-map` (Home, Atlas, both themes). Inspection: Chromium accessibility tree through the DevTools protocol (role generic, name from title). | Preferred: take the markers out of the Tab order (`keyboard: false`) and hide the marker layer from assistive technology, so the labelled route list is the way in. If markers stay focusable: give them `role="link"` and an `aria-label`, and change the container from `role="img"` to a labelled `role="region"`. |
| A11Y-03 | Home, Atlas (world map) | Best practice (related to 2.1.1 Keyboard, A, and 2.4.1 Bypass Blocks, A) | Moderate | Keyboard users pass 47 stops in each map. A focused marker shows no name, no pop-up and no route highlight: these appear only on mouse hover, because Leaflet 1.7.1 does not pass focus events to markers. Home has 101 Tab stops in total, 47 of them in the map, and no route list beside it. On Atlas the list beside the map gives the same information and highlights each route on focus. | Inspection: Tab walk counts; focus probe (pop-up not shown, list not highlighted); `shots/F-map-marker-keyboard-focus.png` next to `shots/F-map-marker-mouse-hover.png`. | Home: markers out of the Tab order, and a link under the map: "All 30 routes as a list (Atlas)". Atlas: the same, or a "Skip the map" link to the list. |
| A11Y-04 | Home, Atlas (world map) | 1.4.13 Content on Hover or Focus (AA). Failure | Moderate | The pop-up that appears when the pointer is over a marker disappears as soon as the pointer moves onto it. People who use screen magnification often need to move the pointer onto a pop-up to read it. The script closes it on Escape (good; read in the code, not tested). | Inspection: simulated mouse, hover a marker, then move onto the pop-up: it is gone. Human check needed: with a mouse and Windows Magnifier (7D). | Keep the pop-up open while the pointer is over the marker or the pop-up; close it after a short delay once the pointer has left both. |
| A11Y-05 | Object pages (photo viewer) | 2.4.3 Focus Order (A). Failure | Serious | The full-screen photo viewer is a modal dialog (`role="dialog"`, `aria-modal="true"`). Opening it moves focus to Close, and Escape returns focus to Enlarge (good). But after three Tab presses focus leaves the viewer and moves through the footer links hidden behind the dark overlay. Keyboard users cannot see where focus is; screen reader users are told the page behind is unavailable while focus is in it. | Inspection: simulated keyboard, 6 Tabs after opening. `shots/F-lightbox-focus-behind-dialog.png` (faint ring on "About & team" behind the overlay). | Keep Tab inside the viewer while it is open (from the last control back to the first) and make the rest of the page `inert`; or rebuild the viewer on `<dialog>` with `showModal()`, which does both. |
| A11Y-06 | Object pages (photo viewer) | 2.1.1 Keyboard (A). Failure | Moderate | In the photo viewer, zoom and pan work only with the mouse wheel and dragging. There are no zoom buttons and no zoom keys (tested +, =, Ctrl+= and arrow up: no change), so people who use a keyboard or switch access cannot look at details. | Inspection: viewer script (`images-vis.js`) and simulated keys (scale stayed at 1). | Add Zoom in, Zoom out and Reset buttons; support + and -; when zoomed, pan with the arrow keys. |
| A11Y-07 | Object pages (tour) | 2.4.3 Focus Order (A). Failure | Moderate | (a) Choosing an object in the numbered strip at the bottom scrolls the page to the top, but focus stays on the strip button at the bottom, off screen. (b) At the last object of a tour, Next becomes disabled while it has focus, and focus falls back to the page itself; the next Tab starts again from the top. | Inspection: simulated keyboard (strip: focus 7,790 px down while the page shows the top; Next at the end: focus on the page body). | After an object change from the strip, move focus to the object title (`h1` with `tabindex="-1"`). At the end of a tour keep Next focusable with `aria-disabled="true"` and a visible "End of the tour" note, or move focus to Previous. |
| A11Y-08 | Object pages (tour) | Best practice (related to 4.1.3 Status Messages, AA) | Moderate | The tour text is inside an `aria-live="polite"` region. Each Next, Previous, strip choice, length or complexity change makes screen readers read the whole new text (2,172 characters for object 024 at Long and Expert) without the object's name; the new title is not announced. Users cannot easily tell which object they are on, and long texts are read whether they want them or not. | Inspection: page structure (live region on `.object-text`) and text length. Human check needed: NVDA and VoiceOver (7B, 7C). | Remove `aria-live` from the text. After an object change move focus to the `h1` (which reads the name), or announce a short status such as "Stop 21 of 30: Moctezuma's Headdress". |
| A11Y-09 | Object pages (tour bar) | 1.4.11 Non-text Contrast (AA). Failure | Moderate | The position in the tour is shown only as a 3 px bar. Its track has 1.79:1 contrast with the background in the dark theme and 1.62:1 in the light theme, and the fill has 2.87:1 against the track in the light theme, so the end of the bar is hard to see. There is no number on screen (the documentation describes "01 / 30"). People with low vision cannot tell how far they are in the tour. Screen readers do get "stop 2 of 30" from `aria-valuetext` (good). | Inspection: computed colours; `shots/F-tour-progress-bar.png`. | Show the position as text ("Stop 2 of 30") next to the bar, and raise the track to at least 3:1 (the text colour at 50% gives 3.26:1 in the dark theme). |
| A11Y-10 | Tours (light theme); Atlas route list on hover or focus (light theme) | 1.4.3 Contrast (Minimum) (AA). Failure | Moderate | Vermilion text on the raised background in the light theme: #C9341A on #E4E4EE = 4.17:1 (axe measured 4.16:1); 4.5:1 is needed. Seen in the reading summary on Tours ("short texts · fun level", 13 px) and in the highlighted object title in the Atlas list (18 px) on hover or focus. The dark theme passed everywhere it was measured. | Automated: axe `color-contrast` (Tours, light). Inspection: computed style of the focused Atlas list item. `shots/F-light-theme-summary-contrast.png`. | Darken the light-theme signal colour, for example to #B82F17 (4.81:1 on #E4E4EE, 5.35:1 on #F0F0F5, white text on it 6.07:1), or use the text colour for text on raised backgrounds. |
| A11Y-11 | Home, Atlas, object pages | 2.2.2 Pause, Stop, Hide (A). Failure, to confirm | Moderate | The dashed routes on the world maps move without end (29 endless CSS animations on Home and on Atlas, 1 on each object page), and the 3D model turns by itself until someone uses it ("Reset view" starts it again). Only the moving list on Home has a Pause button. All motion stops when the system asks for reduced motion (good), but there is no control on the page for people who have not set it, for example people who find movement distracting while reading. | Inspection: running animations counted with and without emulated reduced motion; 3D frames compared 1.5 seconds apart. | Stop the route animation after 5 seconds, or animate only the highlighted route. Add a visible pause button to the 3D viewer, or start it still. |
| A11Y-12 | Atlas and object pages (floor plans); object pages (RDF graph) | 4.1.2 Name, Role, Value (A); 1.3.1 (A). Failure per axe, effect to confirm | Moderate | The floor plans are SVGs with `role="img"` that hold 14 to 15 focusable links; the RDF graph is an SVG with `role="img"` that holds 6 to 16 focusable buttons. Chromium still exposes these links and buttons with their names, but screen readers in browse mode may present each SVG as one picture and skip them. Text versions sit next to both (room lists, "All statements as text"), which lowers the impact. | Automated: axe `nested-interactive` (Atlas, object pages, both themes). Inspection: Chromium accessibility tree (the links and buttons are not ignored). Human check needed: NVDA (7B). | Change `role="img"` to `role="group"` with the same label on both SVGs, so the links and buttons are presented; or hide the interactive layer from assistive technology and point to the text lists. |
| A11Y-13 | Atlas (floor switch); object pages ("Go deeper") | 4.1.2 Name, Role, Value (A); 1.3.1 (A). Failure | Minor | Two sets of tabs are incomplete. Atlas floor switch: `role="tab"` buttons with no tab panel and no `aria-controls`. "Go deeper": no `aria-controls`, no arrow-key movement, and the tab list and panel have no names. Screen readers announce tabs but cannot find the panel. The era tabs on Home are complete and can be the model. | Inspection: page structure and accessibility tree. | Reuse the era tabs code for both; or make the floor switch two buttons with `aria-pressed`. |
| A11Y-14 | Atlas and object pages (floor plans, world maps) | 1.4.11 Non-text Contrast (AA). Failure | Minor | The object dots on the floor plans are outlined in the text colour at 45%: 2.84:1 (dark) and 2.13:1 (light). Returned routes on the world map in the light theme: 2.87:1. The room lists and the route list give the same information, so the impact is low. | Inspection: computed colours; `shots/F-floor-plan-dots-light.png`. | Raise to at least 3:1 (dark: 50% gives 3.26:1; light: 65% gives 3.19:1). |
| A11Y-15 | Documentation | 1.4.10 Reflow (AA). Failure | Minor | At 320 px wide, the inline file name `5_Europe_The_Parthenon_Elgin_Marbles.rdf` runs past the right edge and is cut off; `body` has `overflow-x: hidden`, so it cannot be scrolled into view. The visitor pages reflow without loss (section 6). | Inspection: layout scan at 320 px; `shots/F-documentation-320px-cut-off.png`. | `overflow-wrap: anywhere` on inline code in the documentation. |
| A11Y-16 | Documentation | 2.1.1 Keyboard (A). Failure in some browsers | Minor | Two code blocks that scroll sideways cannot take keyboard focus, so in browsers that do not make scroll areas focusable (Safari) keyboard users cannot scroll them. | Automated: axe `scrollable-region-focusable`. | Wrap long lines (`white-space: pre-wrap`), or give each block `tabindex="0"`, `role="region"` and an `aria-label`. |
| A11Y-17 | Documentation | Best practice (related to 1.3.1, A) | Minor | Two empty header cells in the Overview table. | Automated: axe `empty-table-header`. | Use `td` for the empty cells, or give them header text. |
| A11Y-18 | Object pages, Tours, Collection (all segmented buttons); object pages (progress bar) | Beyond WCAG 2.1 AA (Windows contrast themes); related to 1.4.1 Use of Color and 1.4.11 | Moderate | In forced-colours mode, which Windows contrast themes use, the selected tour, length, complexity, region and view buttons look the same as the others, because "selected" is only a background colour and the system replaces it. The tour progress bar disappears. The documentation says Windows high-contrast mode is supported. | Inspection: Chromium forced-colours emulation; `shots/F-forced-colours-pressed-state-lost.png` (Medium and Basic are selected). Human check needed in a real contrast theme (7D). | In `@media (forced-colors: active)`, give pressed buttons `background: Highlight; color: HighlightText` (or a thick border and a check mark), and give the progress fill a system colour. |
| A11Y-19 | Collection | Best practice (related to 2.4.4 Link Purpose (In Context), A) | Minor | Each card is one link whose name starts with the seal: "Seal: Contested. Held in London, UK. 001, Room 5, floor 1 Benin Bronzes ...". In a screen reader's list of links all 30 start with "Seal", so finding an object by name is slow. | Inspection: Chromium accessibility tree. Human check needed: NVDA links list (7B). | Put the title first: point `aria-labelledby` on the link to the title and the short summary, or move the seal after the title in the source order. |
| A11Y-20 | Atlas (intro and floor plan legend) | Best practice (related to 1.3.3 Sensory Characteristics, A) | Minor | The instructions mention only the mouse: "Hover an object to follow its route; select it to open its page" and "Object (point at it for its name)". | Inspection. | "Hover or focus an object ...", and say that the list beside the map has the same routes. |
| A11Y-21 | All pages (menu on narrow screens) | Best practice | Minor | Escape does not close the open menu (`aria-expanded` stays "true"). | Inspection: simulated keyboard at 375 px. | Close the menu on Escape and return focus to the Menu button. |
| A11Y-22 | Object pages (85 photos) | 1.1.1 Non-text Content (A). To verify | Moderate until reviewed | Every object photo has a text description (good), but the 85 descriptions were generated and are marked `"reviewed": false` in `llm-data.json` ("Not yet reviewed by the project team"). A wrong or invented detail would mislead people who cannot see the photos. The descriptions in the sample read well, for example "The throne of Glele in a glass case lit by red and green light." | Inspection: structure scan (alt present on the main photo) and `llm-data.json`. Human check needed (7E). | Alice reviews all 85 against the photos and marks them reviewed. |

### Suggested order of fixes

1. A11Y-05 photo viewer focus (small change, serious).
2. A11Y-01, 02, 03 maps: markers out of the Tab order, route list link, focus style.
3. A11Y-07 and 08 object change: focus to the title, no live region on the text.
4. A11Y-09 position as text; A11Y-10 light vermilion; A11Y-18 forced colours.
5. A11Y-11 motion controls; A11Y-12 and 13 roles and tabs; A11Y-04 hover pop-up; A11Y-06 zoom buttons.
6. Minor items; A11Y-22 photo description review; then update the documentation (section 5, O-4).

## 5. Other issues found (not WCAG)

| ID | What happens | How found | Suggested fix |
|---|---|---|---|
| O-1 | **Functional bug.** When the object page address names a tour (links from the Tours page thumbnails and the "Read it in this tour" links), the tour buttons in the tour bar do nothing: the page reloads and the address puts the old tour back. Tested: object 005 opened in the Timeline tour, Geo pressed, page still in the Timeline tour. | Inspection: script (probe D) and `object-page.js` (`changeTour` reloads the same address). | Make the tour buttons go to `Object-page.html?tour=<new tour>` instead of reloading. |
| O-2 | Next and Previous do not update the address: after Next from object 008 the page shows Tipu's Tiger but the address still says `no=8`, so reload, Back and shared links show another object. | Inspection: script. | Update the address with `history.replaceState` (or `pushState`) on each object change. |
| O-3 | "Start tour" in the header and on Home, and the tour buttons on the object page, reset the reading level to Short and Fun. A visitor who chose Long and Expert loses the choice without being told. | Inspection: `site.js`, `object-page.js`. | Keep the saved length and complexity. |
| O-4 | The site's documentation (section "Accessibility") makes claims the tests did not confirm: "A visible 3px vermilion focus ring on every interactive element" (not in the maps, A11Y-01); "Windows high-contrast mode is supported" (A11Y-18); "The page language changes with the chosen translation" (the translations were removed; `lang="en"` is correct for the content now); the object page section describes the position as "01 / 30" (only a bar is shown, A11Y-09). | Inspection. | Update the documentation after the fixes. Useful for the case study: claims need testing. |

## 6. What already works well (checked)

- **Skip link** is the first Tab stop, clearly visible (`shots/W-skip-link-first-tab.png`), and moves the starting point to the main content (the next Tab lands on "Start the tour").
- **Language and titles:** `lang="en"` on every page; unique, descriptive page titles; object pages update the title for each object.
- **Structure:** one `h1` per page and heading levels in order on all 8 pages scanned; landmarks for header, main navigation ("Main"), main, footer, labelled sections, "Objects in this tour" navigation and the "Museum label" aside.
- **Names and states:** 0 unnamed controls on 8 pages. `aria-pressed` on tour, length, complexity, region, view and theme buttons; `aria-expanded` on Menu; `aria-current` on the current object in the strip; the progress bar has `aria-valuetext` ("Timeline tour, stop 21 of 30").
- **Era tabs on Home:** complete tab pattern (one Tab stop, arrow keys, `aria-controls`, labelled panel).
- **Focus ring:** 3 px vermilion with an offset on all controls outside the maps: 5.81:1 (dark) and 4.63:1 (light) against the background. Floor plan links and graph nodes show focus.
- **No keyboard traps:** the Tab walk reached the end of all 5 pages.
- **Pop-ups:** the graph's statement pop-up moves focus to Close, and Escape returns focus to the node (tested). The map script also closes its pop-ups on Escape (read in the code).
- **Reflow and spacing:** no horizontal scrolling at 320 px or at 200% zoom on Home, Collection, Tours, Atlas and two object pages; with the 1.4.12 spacing values no text was cut off.
- **Reduced motion:** with the reduced-motion setting, 0 running animations on Home, Atlas and object 001, the 3D model does not turn, fade-ins are off; the moving list has a Pause button.
- **Alternatives for complex visuals:** Atlas lists all 30 routes and all rooms; object pages give origin, holder and room as text in the museum label, a caption for the world map and "All statements as text" for the RDF graph; the 3D view turns with the arrow keys and zooms with + and -; decorative images have `alt=""` inside named links.
- **Text contrast:** dark theme text colours 5.41:1 to 9.99:1; light theme passes apart from A11Y-10. Routes are told apart by dash pattern as well as colour.
- **Status messages:** the Collection count is announced through a polite live region ("03 / 30 objects") when a filter changes.
- **Maps** do not capture the mouse wheel, and zoom has buttons as well as pinch.
- **Links:** no broken internal links or images in the sample (49 targets), no console errors, no failed requests.

## 7. Checklist for Alice (only a person can do these)

Tick each item, write what happened, and update the finding it points to.

**A. Real keyboard pass** (Windows, Chrome and Firefox, mouse unplugged)

- [ ] A1. Home: Tab from the address bar. Skip link first and visible? Enter, then Tab: inside main?
- [ ] A2. Count the Tab presses needed to pass the world map. Can you see focus on each stop? (A11Y-01, 03)
- [ ] A3. Era tabs: arrows move and select; Tab goes on to the panel.
- [ ] A4. Start the Timeline tour; change Length and Complexity; press Next three times; go to the last object and press Next. Where is focus? (A11Y-07)
- [ ] A5. Choose an object in the numbered strip at the bottom. Where is focus? (A11Y-07)
- [ ] A6. Enlarge a photo, Tab five times, then Escape. Try to zoom with keys. (A11Y-05, 06)
- [ ] A7. 3D viewer: focus it, arrows, + and -, Reset view.
- [ ] A8. RDF graph: open a branch, open a statement, Escape.
- [ ] A9. Atlas: floor switch with the arrows; Tab through the floor plan links; check that the route list highlights routes.
- [ ] A10. Firefox: are focus rings drawn on the floor plan links and graph nodes (SVG)?
- [ ] A11. Narrow window or 400% zoom: open Menu, Tab through it, press Escape. (A11Y-21)

**B. NVDA** (current version) with Firefox, then with Chrome

- [ ] B1. H through the headings on Home, object 001 and Atlas: does the order make sense?
- [ ] B2. D through the landmarks; Insert+F7 links list on Collection. (A11Y-19)
- [ ] B3. Object page: what is read after Next, and after changing Length? Is the object's name read? (A11Y-08)
- [ ] B4. Tour bar: is the progress bar read as "stop n of 30"? Are the tour buttons read as toggle buttons with their pressed state?
- [ ] B5. World map on Home and Atlas, in browse mode and with Tab: what is read for the map and the markers? (A11Y-02)
- [ ] B6. Floor plan and RDF graph in browse mode and with Tab. (A11Y-12)
- [ ] B7. Photo viewer: announced as a dialog? Can you leave it in browse mode? (A11Y-05)
- [ ] B8. "Go deeper" tabs, floor switch, era tabs. (A11Y-13)
- [ ] B9. Collection: choose a region; is the new count read?
- [ ] B10. Theme button: name and state.

**C. VoiceOver on iPhone or iPad** (Safari)

- [ ] C1. Swipe through Home; rotor for headings and links.
- [ ] C2. Start a tour, change the settings, Next: is the new object's name read?
- [ ] C3. Map on touch: tap a marker. The pop-up docks at the bottom with "Open the object page" and Close: does focus move into it, and is it announced as a dialog?
- [ ] C4. Photo viewer: open, step, close.
- [ ] C5. 3D viewer: what is read, and can you move past it?
- [ ] C6. Documentation: can you scroll the wide code blocks? (A11Y-16)

**D. Visual checks**

- [ ] D1. Windows contrast theme (Settings > Accessibility > Contrast themes): selected buttons, progress bar, focus ring, map markers, seals. (A11Y-18)
- [ ] D2. Browser zoom at 200% and 400% in Chrome and Firefox; Windows text size at 200% (Settings > Accessibility > Text size).
- [ ] D3. Colour Contrast Analyser on what axe could not decide: seal text on collection cards and object pages, legends over the maps, era tab dates, room numbers on the floor plans.
- [ ] D4. Turn off animation effects in Windows (Settings > Accessibility > Visual effects) and check that the site stops moving; then, with motion on, decide on A11Y-11.
- [ ] D5. With a mouse and Windows Magnifier at 300%: hover a map marker, then move onto its pop-up and read it. (A11Y-04)

**E. Content**

- [ ] E1. Review the 85 photo descriptions against the photos (A11Y-22): correct, no guessed details, short (about 150 characters or less), no "image of". Mark them reviewed.
- [ ] E2. Check link text in context ("Read it in this tour", "source").

**F. Walkthrough with readers of the easier levels** (section 8)

## 8. Walkthrough with readers of the Fun and Basic levels (plan)

**Question:** can people who would choose the Fun or Basic level follow one tour, and say where each object came from and where it is now?

**Who:** 3 to 5 people. Suggested groups: secondary school students (with consent from a parent or guardian), adults who read English as an additional language, adults with dyslexia or a learning disability (through a self-advocacy group). Nobody has been recruited yet.

**Readability indicator (automated, indicative only).** Flesch Reading Ease of the Short texts, all 30 objects per tour, with a rough syllable count. The texts are about 45 words long, so single scores are noisy.

| Level | Timeline | Colonial Conquests | Geo |
|---|---|---|---|
| Fun | 71.3 | 69.3 | 69.2 |
| Basic | 51.0 | 46.1 | 53.5 |
| Expert | 33.5 | 20.9 | 30.8 |

Higher means easier. Fun scores like plain texts for readers of about 13 to 15. Basic is described on the site as "understandable without previous knowledge" but scores like texts for older secondary school readers. This is a hypothesis for the walkthrough, not a finding. The hardest Fun Short text in the Timeline tour is Tipu's Tiger (score 32): include it.

**Tour and tasks** (Timeline tour, Short, Fun, the "Start the tour" default):

1. From Home, start the tour.
2. Read the first object. Say in your own words what it is and where it was taken from.
3. Go on to the next two objects.
4. Make the text easier, or longer, and find where you did that.
5. Find where this object is in the virtual museum (floor and room) and where it is held today.
6. Optional: find the Rosetta Stone from the Collection page.

Before the sessions, Alice can walk the same steps with the four cognitive walkthrough questions per step: will the visitor try to do the right thing; will they notice the control; will they connect the control with what they want; will they see that it worked.

**What to record:** task done (alone, with help, not done), time, wrong turns, words they asked about or misread, retelling (accurate, partial, wrong), ease rating per task (a smiley scale for younger readers). SUS is optional; with 3 to 5 people report it as indicative only and say the sample is small.

**Accessible materials and consent:** easy-read information sheet and consent form (large type, short sentences, pictures), consent spoken and written, the right to stop at any time, pseudonyms, no recording of minors without consent from a parent or guardian, a thank-you payment or voucher, breaks, the participant's own device if they prefer. The texts are about colonial looting: say so beforehand, since this may be personal for people from the places the objects were taken from.

**Who this leaves out:** people who do not read English; screen reader users (they need their own session, section 7B and 7C); younger children; people without a device; and, if recruited through schools, it may favour confident readers.

## 9. Proposed outline for the portfolio case study

Working title (to be written by Alice): "Testing a virtual exhibition for keyboard, screen reader and low vision use".

1. **Context and problem.** What The Stolen Archive is (30 objects, three tours at three reading levels, maps, floor plans, 3D scans, a knowledge graph), who built it, Alice's part, and why the visual parts are a risk for people who do not use a mouse or do not see the screen well.
2. **Question.** Can people who use a keyboard, a screen reader, magnification or contrast themes, and readers of the easier levels, take a tour from start to end?
3. **Method.** Sample of 12 page states; automated (axe 4.13.0, both themes), inspection, manual passes with NVDA and VoiceOver, walkthrough with readers. Tools and dates. What each method leaves out.
4. **Findings.** Counts by severity (after Alice's checks), three to five key findings, each with a screenshot and the people it affects; what already worked.
5. **Fixes.** The changes, in priority order, and who made them.
6. **What changed.** Before and after: axe results per page, Tab stops on Home (101 now), keyboard and screen reader results, walkthrough results (real numbers only).
7. **What I learned.** Most findings came from inspection, not from the automated tool; the site's own accessibility claims needed testing; limits of the audit.

**Before and after screenshots** (run the scripts again after the fixes; same names, new folder):

| Before (this folder) | After, to take | Script |
|---|---|---|
| `shots/F-lightbox-focus-behind-dialog.png` | Focus stays on the viewer's controls | `take-shots.js` |
| `shots/F-map-marker-focused-closeup.png` | Visible focus, or markers out of the Tab order and a list link | `probe-marker-ring.js` |
| `shots/F-map-marker-keyboard-focus.png` and `F-map-marker-mouse-hover.png` | Name shown on focus, pop-up stays when hovered | `take-shots.js` |
| `shots/F-tour-progress-bar.png` | "Stop 2 of 30" next to the bar | `take-shots.js` |
| `shots/F-light-theme-summary-contrast.png` | Darker vermilion | `take-shots.js` |
| `shots/F-forced-colours-pressed-state-lost.png` | Selected buttons visible | `probe-extra.js` |
| `shots/F-documentation-320px-cut-off.png` | File name wraps | `probe-doc-320.js` |

**Notes for the case study**

- **Overlap check:** the method (accessibility testing) does not repeat the thesis on adaptive shared spaces and collective decisions, the MMID robot car and suit, or the DSP Rijksmuseum game. The topic does sit next to the DSP Rijksmuseum game (both museum projects), so lead with the testing method rather than the museum theme.
- **Credit:** the About page lists three team members (Alice Picco, Corrado Consiglio, Marco Lamorte), and the footer says the site was made for a 2024 course and "will not be maintained or updated". The case study should say who built what, which fixes Alice made and when; update the footer if the site is now maintained.
- The text goes under Alice's name, so it should be written by Alice (with writer-alice); images should get a design review before publishing.

## 10. Files in this folder

- `audit.md`: this document.
- `axe-results.json`: raw axe output for 12 page states in the dark and light themes.
- `inspection-results.json`: raw results of the structure, keyboard and visual scripts.
- `shots/`: screenshots of rendered pages (no screenshots of anyone's screen). `F-` = finding, `W-` = works well.
- `scripts/`: the scripts used (`run-axe.js`, `inspect-structure.js`, `inspect-keyboard.js`, `inspect-visual.js`, `take-shots.js`, `probe-*.js`, `fetch.mjs`).
