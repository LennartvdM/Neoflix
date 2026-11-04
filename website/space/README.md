# website/space/ — the site as one place

The homepage and every record's address (`/`, `/films/*`, `/toolbox/*`,
`/publications/<slug>`, `/paths/*`, `/search`) render one continuous
space instead of pages. It is an experiment, and it is meant to move.

## The idea

Every record has a fixed place on one plane, and directions mean the same
thing everywhere:

- **north** the evidence: the six papers, each above the films it supports
- **middle** the argument: the six films, read west to east
- **south** the practice: the toolbox, one column per step of the loop
  (before you record → record → reflect → refine → keep going, and back)

It is bright and cold, the pale grey of a hospital (no cream, no warm
paper): a light ground, with the films
in one dark band across the middle, edge to edge (`SPACE.band`). The
videos and the dark are blocks of colour on the page, not the page.

The three tiers the site always had are three **distances** from it, not
three pages (the gauge, bottom right): *close up* (one record),
*the argument* (films with their papers), *everything* (the library,
with your route on it).

## Story mode (the tour)

A newcomer isn't left on the map: they're taken through it. The tour
(`tour.js`, played by `Tour.jsx`) is a script for the camera, 17 stops
across the whole space with the words told beside what they're about.

- **Scroll position is the camera's position along the story.** Each
  stop has a hold (the camera stays and pushes in slightly, the words are
  read) and a travel (the camera flies on, the words cross-fade at the
  midpoint). It isn't vertical: the story runs west along the films,
  north to the papers, south into the toolbox, and scrolling either axis
  scrubs the flight itself. Letting go settles on a stop in the direction
  you were going, so one flick is one stop. Keys, the bar's ticks and
  chapters, and "Play" also move it.
- **Two depths.** `core` stops (the argument) dwell and get room;
  `skim` stops (the papers as a row, the toolbox's five columns) are one
  line and a short hold. Newcomers see that the toolbox is there and what
  it's shaped like without being walked through 68 pages.
- **The impatient and the returning skip it.** The *doors* (start in
  your own unit, read the evidence, look around) are on the first and
  last stop, and appear on any stop when the reader moves faster than the
  story (three stops in three seconds). Drag, pinch, search or open a
  record and the tour pauses where it is; "Resume the tour" flies back.
  Someone who left half way comes back to where they were ("Welcome
  back"); someone who finished lands on the map with their route in gold
  and a way back to the last thing they opened. Progress lives in
  localStorage (`neoflix:tour`), nothing else.

What it does about the usual web:

| The usual frustration | Here |
|---|---|
| A click wipes the world | Opening a record is a camera flight; its sheet opens beside its place, everything else stays in view |
| Links are blind | Hover a link in a sheet and a line runs to where it lands; off-screen links show as chips on the edge, pointing the way |
| You never see the shape of a site | Zoom out. It's always the same map |
| Slideshow (calm, compartmentalised) vs. labyrinth (free, lost) | A path is a rail through the open space: scroll or ←/→ moves along it, and you can step off anywhere |
| The site makes you do all the navigating, or forces a tour on everyone | Story mode takes newcomers through it and skims what they only need to know exists; doors and resume let everyone else go where they need to be |
| Search is a separate list | Type anywhere: the space dims, the matches light up, the camera frames them |
| The site forgets what you read | Your trail is inked on the map (localStorage only; nothing leaves the browser) |

## Files

| | |
|---|---|
| `layout.js` | Where everything sits, the wires between records, the paths' rails, the named regions. Node-safe. |
| `camera.js` | The camera (`{x, y, k}`), flights along a smooth zoom-and-pan curve, framing a record |
| `Space.jsx` | The plane, the cards and their levels of detail, input (drag, wheel, keys), the HUD, search, path walking, the off-screen chips, the link probe; where the camera stands for each tour stop (`tourCam`) |
| `tour.js` | The tour's script: stops, chapters, depths, the words, the doors. Node-safe; `system-check.mjs` fails the build when a stop names a record that doesn't exist |
| `Tour.jsx` | Story mode: scroll→camera along the stops, snapping, play, the narration and the bar |
| `Sheet.jsx` | A record's reading sheet: the library's modules (`system/modules`) in one column, minus what the space already shows |
| `space.css` | All of it. Anything that must stay the same size on screen divides by `--k`, the zoom, which the camera sets every frame |

## Traps

- **The camera writes the plane's transform directly**, every frame, with
  no React render. Cards only re-render when focus, search or the trail
  change. Keep it that way: 86 cards re-rendering per frame stutters.
- **Text sharpness.** `will-change: transform` is set only while moving;
  leave it on and Chrome keeps the text rasterised at the old zoom.
- **Levels of detail** are attributes on the plane (`data-lod-film`,
  `data-lod-paper`, `data-lod-guide`, `data-far`), set only when the zoom
  crosses a threshold. A far-away card is a shape and a screen-sized label.
- **Input.** A mouse wheel zooms; a trackpad's two-finger scroll pans and
  its pinch zooms (heuristic in the wheel handler). On the tour, scrolling
  in either axis moves along the story instead, and a pinch leaves it.
- **The tour drives the camera with `nudge`, not `fly`**, every frame
  from its own position `p`, so scrubbing backwards is exact. A jump of
  more than one stop is a real `fly` (fast-forwarding through every stop
  in between is dizzying). Its stops' cameras depend on the window and
  are recomputed on resize (`tour.layout()`).
