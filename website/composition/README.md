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
- **Each page gives what's needed, a little of what you could want, and
  nothing else** (`ontology.js`; the owner, 2026-11: "always give the user
  the information they need, the information they could want (without
  competing for what they need) and without overwhelming it with showing
  the entire index"). Three tiers:
  - *need*: what the page is about, in full and biggest (the story's
    words and the one film, paper or page they're about; a record's own
    content: a film's "in the unit", a paper's finding and summary, a
    toolbox page's text). A page about a set shows the set (the six
    papers, the five steps, a step's chapters, a path's steps).
  - *want*: at most three things, small, beside the words, each with its
    reason and the content's own line ("The evidence · Paper 5 · In one
    of our studies, 8 of 20 infants…"). Chosen from what the record rests
    on, in the order a reader needs it.
  - *adjacent*: what lies right beside the subject **percolates out of
    it** (the owner, 2026-11: "every item has adjacent / related content
    percolating from it"): up to four neighbours (the films either side,
    films resting on the same evidence, its papers, the pages beside it;
    `percolateOf` in `ontology.js`, never repeating a want) seep out
    from behind the subject on a spring and settle at its edges: a row
    above, one larger below and off the page's edge. They drift a little,
    are quiet (faded, no captions) until pointed at, and are a click
    away. Not a list: the sense that the thing sits in a body of
    material (`Percolate` in `Page.jsx`). Each neighbour is **tethered
    outward**: a white dashed line runs from behind it, away from the
    subject, off the page's edge, to the rest of the material it belongs
    to. Never inward to the subject (the owner: "an internal tether would
    be a mess"); the subject's own edges are the wants'.
  - *rest*: not on the page. Reachable (the sidebar, down, right), never
    listed. Citations and the like are actions in a record's title block.
- **The graph is visible, in three places**, drawn like marker on a
  whiteboard, not traces on a circuit board (the owner, 2026-11): broad,
  dashed, white, quiet. The kind of link is said by the label colour on
  the card (blue the evidence, green the practice, indigo a film), not by
  the line:
  - *on every page*, each want is tied to what the page is about by a
    drawn edge, so the page shows why it's offered; following one lights
    its edge before the page moves;
  - *on arrival*, a record reached from another page opens with the edge
    you came in on ("From Film · Urgency: In one of our studies, 8 of 20
    infants…", `graph.threadBetween`);
  - *the map* (`LibraryMap.jsx`, "Map" in the sidebar): the whole library
    as one graph on demand, three bands (papers on their years, films,
    the toolbox's pages in the five steps), where you are pulsing, your
    route through it in gold, hover to light connections, click to go.
    The pages never show the whole index; the map is where it lives.
- **The sidebar isn't the index either**: only your chapter opens; the
  others are one line each; a branch shows the trail you took and two
  pages either side of yours, the rest counted.

A record's page has the record's own URL; which branch you reached it by
rides in the history state (back and forward return to the same place).
A record reached by its URL alone opens at its natural home: a toolbox
page under its step of the loop, a paper under the six papers, a film at
its stop. Other pages are `/?at=3.1`.

## The pieces

| | |
|---|---|
| `atlas.js` | The tree of pages: the story's stops and what each opens onto; `move(addr, dir)` for one page in a direction; each record's home. Node-safe. |
| `ontology.js` | What each page gives: its need, its wants (≤ 3, with reasons), its layout. Node-safe. |
| `Composition.jsx` | Where you are (from the URL), the pager (wheel, keys), the page slide, the ways on at the page's edges, search, bookkeeping. |
| `Sidebar.jsx` | The anchor: where you are, without the whole index. |
| `Page.jsx` | One page, drawn from the ontology: the running head, the words, the wants and their edges, the edge you came in on, the need. |
| `LibraryMap.jsx` | The whole library as one graph, on demand. |
| `tour.js` | The story: its stops, their words, their short names in the sidebar. Node-safe. |
| `composition.css` | The look. |

## The look

Adopted from the owner's Talent naar de Top deck (Vragenlijst-Executive-
Search, `factsheet-deck/shell/base.css`) "for now", as the owner asked:
Space Grotesk 500 for display (titles, the running head, big numbers),
Inter for reading and UI (both self-hosted, `shared/fonts.css`); indigo
inks (`--brand #1c1c6e`, `--accent #3b5bdb`) on the deck's pale cool
gradient; white cards with a soft lift (radius 22); small spaced
capitals for eyebrows; a running head of a numbered pill and the
chapter; the frosted sidebar card; pill buttons. The films are the dark
tiles. If the deck's language changes, change the tokens at the top of
`composition.css` to match.

### Two ways to show a film (they mean different things)

After the owner's earlier /neoflix layouts ("Task-driven focus can lead
to tunnel vision"): a film is either **feathered** or **demarcated**.

- **Feathered: the moment.** No edge; the film dissolves into what's
  around it. A story stop about a film is a *scene* (`Scene` in
  `Page.jsx`): the film feathers into a dark card and the stop's words
  sit on it, headline and a barred lead, with the wants beside it. The
  first page's film is *atmosphere* (`Atmosphere`): it dissolves into
  the page itself. You're in it; you don't pick it up.
- **Demarcated: the record.** A hard, clean frame (a crisp 1px edge): a
  film record's own card, the percolating stills, a set's tiles, the
  *chip* (`FilmChip`). Something you can open, cite, pack.
- A feathered film always carries a small demarcated chip of itself
  ("Film 1 of 6 · Urgency · Open the film"): the moment, and the record
  of it, one click away.

## Traps

- **One gesture, one page.** The pager swallows the rest of a gesture
  (until the wheel is quiet for 200 ms, and at least 560 ms after a
  move). A text that scrolls inside its element keeps the wheel until it
  reaches its end; only then does the page move.
- **A dashed edge can't draw itself in with its own dashes** (the draw-in
  trick is a dash the length of the path). On the page each edge draws a
  solid copy into a mask and the dashes show through it; on the map the
  edges fade in instead.
- **The edges measure the page after it is attached** (`Wires` in
  `Page.jsx` uses a passive effect: it is a child of the element it
  measures, and a parent's ref isn't set yet during a child's layout
  effect). They re-measure on resize and on the page's own scroll.
- **A page longer than the screen scrolls first**: the pager lets any
  scrolling element (the page, a long text) keep the wheel until it
  reaches its end.
- **`scripts/system-check.mjs` walks the atlas**: every record must have
  a page, every move from every page must land, and every page must have
  its need and no more than three wants, each real and with its reason.
- **Phones** get a bar with ← ↑ ↓ → instead of the sidebar, and pages
  that scroll; kept from breaking, not designed for (CLAUDE.md).
