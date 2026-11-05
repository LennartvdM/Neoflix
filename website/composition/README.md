# website/composition/ — the site as pages in two directions

The homepage and every record's address (`/`, `/films/*`, `/toolbox/*`,
`/publications/<slug>`, `/paths/*`, `/search`) render one atlas of pages
(`atlas.js`), with a sidebar as the reader's anchor.

- **Down is the story**: the tour's 17 stops (`tour.js`), one page each.
- **Right is depth**: from any page you can go into what it rests on. A
  film's stop opens onto the film, then the papers behind it, then the
  toolbox pages that put it into practice; a paper onto its practice; a
  step of the loop onto its chapters, a chapter onto its pages; a path
  onto its steps. **Left** is back out.
- Going down past the last page of a branch carries on with the story.
- **Pagination, not a canvas** (the owner, 2026-11: "pagination to break
  up the prezi feel"). One gesture is one page: a wheel or trackpad
  gesture moves exactly one page in its main axis and its momentum is
  swallowed (after the beat pager of the Talent naar de Top deck in
  Vragenlijst-Executive-Search). The new page slides in whole from the
  direction you moved; nothing zooms or flies.
- **The sidebar is the anchor** (`Sidebar.jsx`). On the story it is the
  whole story by chapter. Go right and it branches: the page you came
  from opens into a list of its own, joined by a line, while the rest of
  the story folds to its chapter names; it widens a step for every level.
  Go back and the branch folds shut. Every entry is a way there, and says
  how many pages lie to its right.
- **Each page is still self-assembling**: its elements (records, the
  voice, an open record's modules) are their own objects with their own
  sizes, clamped to each other by the magnet (`magnet.js`, `contexts.js`).

A record's page has the record's own URL; which branch you reached it by
rides in the history state (back and forward return to the same place).
A record reached by its URL alone opens at its natural home: a toolbox
page under its step of the loop, a paper under the six papers, a film at
its stop. Other pages are `/?at=3.1`.

## The pieces

| | |
|---|---|
| `atlas.js` | The tree of pages: the story's stops and what each opens onto; `move(addr, dir)` for one page in a direction; each record's home. Node-safe. |
| `Composition.jsx` | Where you are (from the URL), the pager (wheel, keys), the page slide, the ways on at the page's edges, search, bookkeeping. |
| `Sidebar.jsx` | The anchor: the atlas as a branching outline. |
| `Page.jsx` | One page: its elements assembled and drawn, the voice (the words for the page), an open record's modules (measured, then assembled). |
| `contexts.js` | What is out on each kind of page, how big, and what clamps to what. Node-safe. |
| `magnet.js` | The assembler: every element docks flush onto an edge of what it belongs to, chosen by attraction; sizes shrink (and blocks of text give up height, scrolling inside) only when they must. Node-safe. |
| `tour.js` | The story: its stops, their words, their short names in the sidebar. Node-safe. |
| `composition.css` | The look. |

## The look

- **Objects, not boxes.** Every element has its own fill; nothing has an
  outline or a shadow.
- **Hierarchy is size**; numbers carry the structure (light, wide
  numerals: paper 3, chapter 11.2, step 4) instead of labels in tracked
  capitals.
- **The words follow the shape**: records are size containers (cq units,
  `@container`); titles narrow in tall elements and widen in wide ones
  (Archivo, self-hosted, width axis 62–125%).
- **Cold**: the pale blue-grey of a hospital, no cream, no pure white.
  The films are the dark; the loop's steps deep blue; teal is where you are.

## Traps

- **One gesture, one page.** The pager swallows the rest of a gesture
  (until the wheel is quiet for 200 ms, and at least 560 ms after a
  move). A text that scrolls inside its element keeps the wheel until it
  reaches its end; only then does the page move.
- **Measured elements are measured at their width**, before paint
  (`.e__content` has its width set explicitly), then assembled.
- **cq units in a container's own padding measure its parent.** Record
  content sits in `.t__in` for that reason.
- **`scripts/system-check.mjs` walks the atlas**: every record must have
  a page, every move from every page must land, and every page must
  assemble without overlaps, elements off the page, or a needed element
  with nowhere to clamp.
- **Phones** get a bar with ← ↑ ↓ → instead of the sidebar, and pages
  that scroll; kept from breaking, not designed for (CLAUDE.md).
