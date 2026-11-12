# The Meme Ontology site: refine, do not redesign

For a Claude Code conversation opened in the site's own repo (memory:
`C:\Users\awlic\Desktop\DHDK\memo\meme-ontology`, remote `alicepicco333/memo`, branch `main`).
Netlify deploys every push to `main` automatically (https://thememeontology.netlify.app/), so:
work on a new branch `refine-2026-11`, commit there, do not push; Alice publishes.

## What Alice wants (12 November 2026)
"I want to keep the meme wall and the structure, but the template looks quite AI and too many
separators and containers." She looked at three redesign directions and rejected all three. So:

- Keep: every page and section in its order (`/`, `/visualizations`, `/thesis`, `/sparql`), all
  content, the meme wall (the home's memes and the Arrange / Shuffle wall of meme tiles), the
  visualizations and their data, the type families unless one is clearly the problem.
- Remove the AI-typical "editorial data" kit: mono label strips with dot or slash separators, the
  ticker row of counts, rules over and under every block, boxes and cards around every section and
  control, numbered mono kickers ("01", "02"...), stat rows between rules, pill buttons in bordered
  groups, uniform hairline frames. Let space, alignment and type size do the grouping. Keep a rule
  only where it carries structure (a table). Controls stay usable (visible focus, 44 px targets)
  without a box around everything. The memes stay the visual material.
- Fix on the way: the thesis reader shows "-143 min read" under the title.
- Accessibility: WCAG 2.1 AA contrast, keyboard, reduced motion as now.
- Writing: plain English, no em-dashes, no emojis, no disability metaphors.
- Alice's direction for project sites: `C:\Users\awlic\.claude\projects\C--Users-awlic\memory\artistic-direction.md`
  (a project site follows its subject; avoid the template; two tests: hide the title, could the
  first screen belong to another project? is it headline + label line + stat row with none of the
  material?).

## Reference made in the portfolio session
`C:\Users\awlic\Projects\portfolio\.claude\worktrees\scroll-immersion\design\memo-refine\`:
`memo-refine.css` (overrides tried on the live site), `NOTES.md` (each change: selector, before,
after, why; and the markup changes CSS cannot do), `shots\before\` and `shots\after\`. If those
files are not there yet, audit the live site yourself with the rules above.

## Steps
1. Check the repo (git status, branch, how the site is built and served locally); create
   `refine-2026-11` from `main`.
2. Apply the refinement in the site's own stylesheets and markup (not as an override file), page by
   page, keeping the structure.
3. Preview locally, compare before and after at 1440x900 and 390x844 on every page, check
   contrast, keyboard and reduced motion, no console errors.
4. Commit in small steps. Give Alice the local preview link and the publish command:
   `git switch main; git merge --ff-only refine-2026-11; git push origin main`.
