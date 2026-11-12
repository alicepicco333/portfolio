# Portfolio audit before deploy, 12 Nov 2026

The local build (branch scroll-immersion-grading, dev server 127.0.0.1:3001), every route: home, contact, resume,
accessibility, the 404 page and all 16 project pages, at 1440 x 900, plus extra passes at 390 x 844, in dark
mode and in high contrast. Two parts: a technical audit (scripts/tech-audit.js) and a design review
(design-critic agent; screenshots in design-shots/, checked by the main session).

## Technical audit

| Check | Before | After the fixes |
|---|---|---|
| axe-core 4.13, WCAG 2.1 A/AA and best practice | 2 rules fail on 13 to 14 project pages (181 elements) | 0 |
| Keyboard pass, homepage, 45 stops | skip link first, rings everywhere, but 7 timeline links focusable at 15% opacity | all readable |
| Page errors | none | none |
| Horizontal overflow at 390 px | none | none |
| One h1 per page | yes | yes |
| Links (114 internal, 17 external) | no broken links | no broken links |

Fixed (commit 8f83111):
1. **Method strip** (components/Method): the paragraph carried `aria-label`, which ARIA does not allow on a
   paragraph, so the label may never be read. It is now screen-reader-only text.
2. **Method strip contrast:** unused steps were `graphite/70`, 2.86:1 on the grey (3.59:1 in dark). Now full
   graphite, 5.1:1 (6.3:1 dark); the outlined square still marks them as unused.
3. **Timeline:** project links ahead of the scroll playhead sit at 15% opacity but take keyboard focus. A
   focused link now shows in full (styles/globals.css, `.jr-item:focus-visible, :focus-within`).

Not counted as faults:
- LinkedIn answers 999 to any automated check; the link works in a browser.
- /projects/5: Vimeo shows automated browsers a security check, live and locally, so the embed could not be
  tested this way. Open the page in a normal browser to confirm it plays.
- Third-party noise inside embeds (Odysee's error reporting on /projects/14).
- Page weight is in the results files, but measured on the dev server; the heaviest pages are /projects/12
  (about 4 MB of images) and /projects/18 on phones (3.7 MB, mostly the video).

## Design review (ranked)

The review's verdict: ready after the first five; 6 to 10 can follow.

1. **Home, 1440: no work on the first screen until a hover.** At rest the map is dots and labels. Open one
   skill by default after the entrance (Interaction design: the rover picture and its projects).
   (home-1440-light-first.jpg, home-1440-light-hover-ixd.jpg)
2. **HCI picture and list do not match.** The picture is the Rijksmuseum Group Hunt, but the list leaves out
   in-progress work and shows Glove, Visor, Rover and Unobravo. Keeping Alice's picture, the fix is to list
   in-progress projects with an "in progress" mark. (home-1440-light-hover-hci.jpg)
3. **The hover picture is small and crowded:** about 231 x 153 px, crossed by links, with a step label on its
   corner and the skill label in its middle. Put the skill on a corner of the picture, stop links at its edge,
   try it 1.4x larger.
4. **The step labels (LISTENING, ORDERING...) read as names of single skills,** and the wording changes between
   the map ("LISTENING") and project pages ("listen"). Light every skill of a step on hover, or drop the labels
   at rest; use one form site-wide.
5. **Narrow hero, 1024 and 390:** the statement drops to medium weight; on phones three 110 px cards repeat
   Selected work one screen later; at 1024 a third of the screen is empty.
6. **In progress is as loud as Selected work** (same 42 px titles). Use the Archive row style; "write-up to
   come" undersells /projects/17, which already has screens.
7. **/projects/18 on phones: the numbered plates shrink to 358 px**, text 3 to 4 px. Add a visible "Open full
   size" line or let them scroll sideways.
8. **Project pages recolour the header** (CV button and logo dot take the project colour: green, rust, grey).
   Keep the header blue everywhere; project colour only inside the case study.
9. **/projects/18 details:** the 3D viewer's poster is orange-brown after a grey-green card; "Sound on" uses a
   play triangle; the video panel is two-thirds empty; "Junior taken apart" lists parts 1 to 4 but the photo
   marks only 2 and 3 (checked); section 05 carries plate "08 / 17", two numbering systems.
10. **High contrast:** the accent becomes #3A3A42, close to the text, so the selected phrase in the statement
    looks dimmer than the rest. Show selection by shape (a chip or a 3 px underline).

Seen in the audit screenshots too (timeline, focus-stop-*.png): the playhead's date label runs over "ROLES",
and the last project label ("Thesis: s...") is cut off at the right edge while the timeline sweeps.

Keep: the palette in all three themes, Inter Tight with JetBrains Mono, straight links, the statement, the
gradings as one family, the Glove plates, the Selected work hover preview and the Archive layout.
