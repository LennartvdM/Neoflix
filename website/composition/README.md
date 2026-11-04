# website/composition/ — the site as elements that clamp to each other

The homepage and every record's address (`/`, `/films/*`, `/toolbox/*`,
`/publications/<slug>`, `/paths/*`, `/search`) render one surface. On it,
every film, paper and toolbox page is **its own element**, with its own
size and shape (films wide, papers tall, a page squarish, a block of text
as tall as its text). Nothing divides the screen. Depending on the
context, elements come out, and **clamp to each other**: whatever is in
focus is put down first, and everything that belongs with it docks onto
its edges, flush, one gutter away, the way a magnet clacks onto a plate.
When the context changes, they let go and re-clamp somewhere else.

The owner's words (2026-11): "In a modern site these are all their own
elements that magnetically clamp to each other depending on the context,
that's a self-assembling interface." Bento is a reference for the balance
of sizes and orientations (a few big, more small; wide next to tall), not
for a grid. (A first version cut the whole screen into a treemap; that
is still a grid, and was replaced.)

## What clamps to what

| Context | What is out |
|---|---|
| At rest | The words (the way in); the films in two runs (the moment, watching it back), the one with the floor big; each paper clamped over the film it supports; the five steps of the loop clamped under the films. The films take turns at having the floor (every 9 s; never while a hand is over the elements; never with reduced motion) |
| A record open | Its modules (the library's own, `system/modules`) clamped round its main one, its title block beside them; a film opens as itself, big, playing. The records it links to clamp to the module that mentions them (papers to the evidence, films to the film module, guidance to "how to do it") |
| A step of the loop | Its head, big; its chapters in a run; each chapter's pages clamped under it; the other steps in reach |
| A search | The matches, clamped to the search, best first and biggest |
| The tour | Each stop is a context (`tour.js` `at`): the subject big, the narration beside it, the controls under the narration, what it connects to clamped round. Scrolling moves everything from one stop's places to the next |

Any element can be **picked up** and dropped; it clamps to the nearest
free edge where it lands, and stays until the context changes.

## The pieces

| | |
|---|---|
| `magnet.js` | The assembler. Puts elements down in order; each docks onto an edge of something already down, choosing among every flush spot by attraction: near what it belongs to, on the side it prefers, edges lined up with the edges around it, touching as much as it can, the whole kept to the screen's proportions. Tries a few sizes and keeps the best (an element on the wrong side, or left out, costs more than being smaller). `dockNear` finds where a dropped element clamps. Node-safe. |
| `contexts.js` | What is out in each context, how big (a few sizes per kind), and what clamps to what with which preferred sides. The site's old geography survives as preference: papers above, guidance below, the next film to the right. Node-safe. |
| `engine.js` | Springs: every element moves to its place a little under critical damping, so it overshoots by a hair and settles (the clack). A newcomer comes out of what it clamps to. Writes styles directly, no React render per frame. Holds elements the reader dropped. |
| `story.js` | The tour's clock (scroll position along the stops, holds, snapping, play). |
| `tour.js` | The tour's script. Node-safe. |
| `Composition.jsx` | The elements, the voice (the words for what you're looking at), the modules, measuring, search, keys, dragging, URLs. |
| `composition.css` | The look. |

## The look

- **Objects, not boxes.** Every element has its own fill; nothing has an
  outline. The only shadow is under an element you are holding.
- **Hierarchy is size**; numbers carry the structure (light, wide
  numerals: paper 3, chapter 11.2, step 4) instead of labels in tracked
  capitals.
- **The words follow the shape**: records are size containers (cq units,
  `@container`); titles narrow in tall elements and widen in wide ones
  (Archivo, self-hosted, width axis 62–125%).
- **Cold**: the pale blue-grey of a hospital, no cream, no pure white.
  The films are the dark; the loop's steps deep blue; teal is where you are.

## Traps

- **Measured elements are measured at their target width**, not their
  animated one (`.e__content` has its width set explicitly). Measure the
  animated width and the height changes mid-spring, which re-assembles,
  which changes the width again.
- **cq units in a container's own padding measure its parent.** Record
  content sits in `.t__in` for that reason.
- **The tour's narration is measured for every stop, hidden**
  (`.cmp__measure`), so each stop's assembly is known before it is shown.
- **Assembly cost** is a few to ~70 ms per context (the resting screen is
  the heaviest). It runs on context changes, not per frame; the tour's
  stops are assembled once and cached. Don't call it in a frame loop.
- **`scripts/system-check.mjs` assembles every context** (every tour
  stop, every record open, every resting state, every step) at desktop
  size and fails on overlaps, elements off screen, or anything a context
  can't do without (`must`) having nowhere to clamp.
- **Phones** get a tall plate that scrolls (the assembly runs from the
  top in a narrow, very tall room), so nothing is left out. Kept from
  breaking, not designed for (CLAUDE.md).
