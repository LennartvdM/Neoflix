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

The three tiers the site always had are three **distances** from it, not
three pages (the gauge, bottom right): *close up* (one film, the intro),
*the argument* (films with their papers), *everything* (the library,
with your route on it). A newcomer arrives close up on the first film
and scrolls film by film; a returning reader arrives further out
(`system/ripeness.js`).

What it does about the usual web:

| The usual frustration | Here |
|---|---|
| A click wipes the world | Opening a record is a camera flight; its sheet opens beside its place, everything else stays in view |
| Links are blind | Hover a link in a sheet and a line runs to where it lands; off-screen links show as chips on the edge, pointing the way |
| You never see the shape of a site | Zoom out. It's always the same map |
| Slideshow (calm, compartmentalised) vs. labyrinth (free, lost) | A path is a rail through the open space: scroll or ←/→ moves along it, and you can step off anywhere |
| Search is a separate list | Type anywhere: the space dims, the matches light up, the camera frames them |
| The site forgets what you read | Your trail is inked on the map (localStorage only; nothing leaves the browser) |

## Files

| | |
|---|---|
| `layout.js` | Where everything sits, the wires between records, the paths' rails, the named regions. Node-safe. |
| `camera.js` | The camera (`{x, y, k}`), flights along a smooth zoom-and-pan curve, framing a record |
| `Space.jsx` | The plane, the cards and their levels of detail, input (drag, wheel, keys), the HUD, the intro, search, path walking, the off-screen chips, the link probe |
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
  its pinch zooms (heuristic in the wheel handler). In the intro, scroll
  steps film by film instead.
