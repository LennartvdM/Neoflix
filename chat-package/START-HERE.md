# Neoflix — a package for a Claude chat session

You're picking up a design playground that has been built in Claude Code,
in the repository `LennartvdM/Neoflix` (the site neoflix.care). This
package lets you work on it in a chat: read the material, understand the
direction, and **build artifacts** (React or HTML) that sketch new pages,
new layouts and new ways of telling the material, using the real content.

The owner is Lennart. He maintains the site conversationally and treats
it as a playground for escaping conventional web design, while solving
real frustrations with how this material is usually presented. The
research behind it is a PhD (six papers on video-recording and
video-reflection in neonatal emergency care, Leiden). The researcher will
later join to give her own direction. The prototype exists so she has
something to hold first.

## What's in the package

| Folder | What it is | Use it for |
|---|---|---|
| `data/` | All the material as plain JSON, computed by the site's own code | Artifacts: copy slices into a `const` |
| `data/media-inline.json` | 31 images as 480 px webp data URIs: the six films' stills and their blurred twins, and 18 session-film keyframes | Artifacts can't load files, so paste these in |
| `starter/AtlasPage.jsx` | One page of the site as a single-file React artifact: tokens, sidebar, feathered film, wants with dashed edges, evidence tucked under, a film moment | Start any new sketch from this |
| `screens/` | 11 screenshots of the current site at 1440×900 | What it looks like now |
| `source/` | The whole codebase, minus large media (see `MISSING-MEDIA.md`) | Reading how things work; code you hand back |
| `DIRECTION.md` | The owner's own words, in order, which set the direction | Read before designing anything |

### `data/`

- **`atlas.json`**: the site as pages. `addr` "5" = the sixth page down
  the story; "0.2.0.0" = from page 0, right to its 3rd child, right to
  that one's 1st, right again. Each node carries `page`: what the
  ontology puts on it (see below). 485 pages.
- **`library.json`**: every record: 74 toolbox pages, 6 papers (with
  asked / found / changed notes and abstracts), 6 films (claim, caption,
  in practice, findings, linked toolbox pages). Also the loop's five steps
  and the three reading paths.
- **`graph.json`**: the 24 links between records, each with the sentence
  that explains why it exists.
- **`ontology.json`**: what the material is made of below records:
  claims, findings, concepts (each with a `motion` brief for an explainer
  animation not yet made), practices, roles, units, and their typed links.
- **`tour.json`**: the story: 17 stops in chapters, intermissions, doors.
- **`films.json`**: the six films, the three paths, the Vimeo URL of the
  session film (keep `dnt=1`).
- **`session-film.json`**: the 6:44 session film transcribed. It has 64
  turns timed to ±0.5 s, 11 scenes, 18 keyframes, and 11 *moments*: cut
  stretches that other pages quote, each tagged with what it shows.
- **`readings/*.json`**: the six papers. **Four are verbatim** (open
  licence, `kind: "reading"`): her text, passage by passage, with our
  layer kept separate: margin `notes`, `intermissions`, and `morsels`
  (quotable sentences, tagged). **Two are synopses** (`kind: "synopsis"`):
  publisher licence, so these are notes in our own words, with key facts.
- The toolbox's full text is markdown in `source/docs-content/`.

## The direction, in short (DIRECTION.md has his words)

- **An atlas of pages, not a scroll.** Down is the story. Right is depth:
  what a page rests on (a film's papers and practice, a step's chapters, a
  chapter's pages). Left is back out. One gesture moves one page, and
  pages slide in whole. This is pagination, "to break up the prezi feel".
- **The sidebar is the reader's anchor**: the story as an outline that
  branches as you go deeper and folds as you come back. It is never the
  whole index.
- **The ontology decides what a page shows** (`atlas.json` → `page`):
  - **need**: the subject, biggest;
  - **want**: at most three things the reader could want, small, each
    with its reason, never competing with the need;
  - **adjacent**: a few neighbours *percolating* out of the subject's
    edges, quiet, a click away;
  - **nothing else.** Don't show the whole index.
- **The graph is visible.** Each want is tied to the subject by a broad,
  white or low-contrast **dashed** edge: "abstract whiteboard, not
  circuitboard". Neighbours **tether outward**, to content off the
  screen. Internal tethers would be a mess.
- **Film has two meanings.** *Feathered* film is the moment: it dissolves
  into a dark card or the page, with the words on it. *Demarcated* film is
  the record: a hard frame you can open.
- **Overlap has meaning.** Over = part of it. Under = what it rests on
  (the evidence, tucked beneath). Separate = elsewhere.
- **Explainer animations are intermissions**: full-bleed, hitting the
  edges, so nothing feels cluttered. For now they are placeholders, each
  with its brief from `ontology.json` → concepts → `motion`.
- **The look** is adopted from the owner's Talent naar de Top deck: Space
  Grotesk (display) and Inter (text), indigo inks, white cards, a frosted
  sidebar. **No warm colours anywhere**: "warm is a deviation from
  sterility". The tokens are in the starter and in
  `source/website/composition/composition.css`.
- He has warned against the generic "Claude look": safe typography, boxes
  outlined everywhere. Be bold. This is a playground.
- **Desktop only.** Design and check at 1440×900. Phones are out of scope.

## Rules that don't bend

1. **Her words are never changed.** In the four verbatim readings, you
   never edit, trim, paraphrase or "improve" a passage, even for a
   prototype. Everything of ours (notes, intermissions, highlights,
   guidance) is a separate layer beside her text. Rewriting her PhD work
   would be inappropriate.
2. **The two publisher-licence papers are not reproduced.** Only use our
   own notes and synopses of them. Never copy their sentences.
3. **The session film is the owner's own production.** It can be cut up
   and quoted freely, and the subtitles are its official English.
4. **No cookies and no analytics.** Keep `dnt=1` on the Vimeo URL.
5. **Name things for what they are**, never for their position or
   version (no `v2`, `two`, `new`).
6. The toolbox text (`docs-content/`) is mirrored from GitBook. Changes to
   it belong in GitBook, not in this code.

## Building artifacts here

**Default: a single-file React artifact.**

1. Start from `starter/AtlasPage.jsx` and keep its CSS-in-a-string
   approach, so the look stays exact.
2. Take the content from `data/`. Copy the slice you need into a
   `const`, the way the starter does; don't invent copy that the material
   already has.
3. Take images from `data/media-inline.json` and put them in the `IMG`
   map.
4. Fonts come in through Google Fonts `@import` in the artifact. That's
   fine for sketches, but the real site self-hosts its fonts and must
   never link Google Fonts.
5. Use a passive `useEffect` to measure the DOM for edges, not
   `useLayoutEffect`. A child's layout effect runs before its parent's
   ref is attached, so the edges silently don't draw. Re-measure after
   `document.fonts.ready`.

**If this chat has code execution:** unzip the package and read the code
directly (`source/website/composition/` is where the design lives).

- **Full build:** `cd source/website && npm ci && npm run build`. This
  needs npm network access, and the clips and PDFs listed in
  `MISSING-MEDIA.md` will 404.
- **Re-checking a reading against its paper** needs the PDFs, which
  aren't included.

**Handing work back:** anything meant for the real site goes back through
Claude Code in the repository. Say which file it changes. The map is in
`source/CLAUDE.md`, the rulebook the code sessions follow, and
`source/website/composition/README.md`.

## Where things live in the code

| Concept | File (under `source/website/`) |
|---|---|
| The atlas (addresses, moves) | `composition/atlas.js` |
| What a page shows (need / want / adjacent / under / witness) | `composition/ontology.js` |
| The story's stops, chapters, intermissions | `composition/tour.js` |
| Rendering a page | `composition/Page.jsx` |
| The sidebar | `composition/Sidebar.jsx` |
| Readings and synopses | `composition/Reading.jsx`, `system/content/readings/` |
| The session film (moments, transcript) | `composition/SessionFilm.jsx`, `system/content/session-film.js` |
| Intermissions | `composition/Intermission.jsx` |
| The whole library as a graph | `composition/LibraryMap.jsx` |
| The data ontology | `system/content/ontology.js`, explained in `composition/ONTOLOGY.md` |
| Films, their papers and practice | `system/content/films.js` |
| All styles of the composition | `composition/composition.css` |
| What exists, counted | `INVENTORY.md` (repository root) |

## Open threads (not done yet, nobody has asked for them yet)

- Better choice of which morsel goes in the evidence slips.
- Real explainer animations to replace the 10 intermission placeholders.
- The FAQ, the four units and their map, and the toolbox's own videos
  have no place in the ontology yet.
- There is no material for parents and no people (who the team is).
