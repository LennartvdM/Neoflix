# website/composition/ — the site as one screen that arranges itself

The homepage and every record's address (`/`, `/films/*`, `/toolbox/*`,
`/publications/<slug>`, `/paths/*`, `/search`) render one screen. Every
film, paper and toolbox page is always on it, as a shape. What changes is
how much room each shape gets, and nobody lays that out by hand: the
reader's situation sets **weights**, and a composer cuts the screen into
shapes that fit together edge to edge, with nothing left over. When the
situation changes, the shapes re-assemble, continuously.

The reference is a bento box, for the balance between sizes: a few big
compartments, more small ones, all fitting. Not a fixed grid: the
divisions move.

## What the weights say

| Situation | What gets big |
|---|---|
| Resting | The films take turns at being the big shape (every 9 s; never while the pointer is over the shapes, never with reduced motion) |
| A record open | Its modules are composed in the middle (the library's own modules, `system/modules`, by the same composer); everything else becomes a live map on the right, where the record is dark and what it links to is grown |
| Hovering a link in an open record | The shape it lands on pulses in the map: links aren't blind, and nothing is ever off screen |
| A search | The matches grow and light up; everything else shrinks and fades |
| A loop step's head clicked | That step's pages take the practice band |
| The tour | Each stop is a weighting (`tour.js` `at`); scrolling re-assembles the screen from one stop's to the next |

## The pieces

| | |
|---|---|
| `compose.js` | The composer. A list in reading order is cut in two (across or along), each half gets the share of the rectangle its weights add up to, and so on down. Every cut gives exact areas, so the only choice is where and which way: the cut that leaves each piece nearest the proportions it wants (films wide, papers tall) and nothing thin wins. A piece holding most of a group's weight takes a side to itself and its small neighbours gather on the other; in a group that may fold, neighbours with too little room fold into it ("+4"). It remembers its cuts and keeps them until another is clearly better, so recomposing every frame doesn't flicker. Node-safe. |
| `scene.js` | What is composed (the tree: three bands north to south as the site always had them: the evidence, the argument, the practice in the five steps of the loop, chapters with their pages) and the weights for a situation (`weigh`). Node-safe. |
| `engine.js` | Keeps every shape where the composer says. Weight changes are eased (the screen is composed at every frame in between, so it is always a whole composition, never shapes sliding over each other); jumps (a cut flipping, a region resizing) are chased, ~70 ms. Writes styles directly, no React render per frame. |
| `story.js` | The tour's clock: scroll position along the stops, holds and travels, snapping, play. Knows nothing about the screen. |
| `tour.js` | The tour's script: stops, chapters, depths, words, doors. Node-safe. |
| `Composition.jsx` | The shapes, the left column (the voice: the tour's words, an open record's title, the way in), reading, search, keys, URLs. |
| `composition.css` | The look. |

## The look (and why)

The owner's note (2026-11): the previous version had slid into the look
every generated site has: Inter, small tracked capitals over everything,
hairline-outlined cards with soft shadows, pills and frosted glass. So:

- **No outlines, no shadows.** A shape is told apart from its neighbour
  by its fill and the gutter between them, like compartments.
- **Hierarchy is size.** The big shape is the important one because the
  composer made it big; there is no badge or border saying so.
- **The words follow the shape.** Every shape is a size container
  (`container-type: size`); what it shows and how large is set from the
  room it was given (cq units, `@container`), and a title narrows in a
  tall shape and widens in a wide one (Archivo's width axis, 62–125%).
- **Numbers carry the structure**: light, wide numerals (paper 3,
  chapter 11.2, loop step 4) instead of labels.
- **Colour is cold**: the pale blue-grey of a hospital, no cream, no
  warm paper, no pure white. The films are the dark; the loop's steps are
  deep blue blocks; teal marks where you are.

## Traps

- **cq units in a container's own padding measure its parent**, not
  itself. That is why every shape's content sits in `.t__in`: padding
  set on `.t` in cq units silently became viewport-sized and hid every
  small shape's title.
- **The engine writes the shapes' transforms and sizes directly**, every
  frame. Shapes only re-render when what they *say* changes. Keep it so.
- **Order is meaning.** The composer never reorders a list, except that
  a dominant piece takes a side and its neighbours gather (in their
  order) on the other. If you add pieces, add them in reading order.
- **`scripts/system-check.mjs` composes every tour stop, every record
  open and every resting state** at desktop size and fails the build on
  overlaps, shapes leaving the screen, or slivers under 20px. If it
  fails after a weight change, the composition really does look broken
  there.
- **Phones** stack the voice over the shapes; they are kept from
  breaking, not designed for (CLAUDE.md).
