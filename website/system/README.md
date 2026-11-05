# website/system/ — the library

The site's records and how they connect. Every toolbox page, paper and film
is a **record**. Each record's page is put together from **modules**, chosen
by the record's own content and by how the reader arrived. **Paths** are
guided sequences through the records. A **trail** and **session pack** keep
the reader's own route.

**The composition (`website/composition/`) draws these records now.** Each
route below renders it: the record is a page of the atlas, its modules
(planned here, in `modules/plans.js`) out as elements clamped round its
main one. Only `/pack` is
still a page here.

Routes:

| Route | What |
|---|---|
| `/toolbox` | The library's front (the toolbox root record): the map, the paths, the toolbox welcome |
| `/toolbox/<slug>` | A guidance record — a toolbox page |
| `/publications/<slug>` | A paper record (all six have one now) |
| `/films/<id>` | A film record — one of the six clips |
| `/paths`, `/paths/<id>` | The paths, and one path's steps |
| `/search` | Browse (no query) or results assembled around a query |
| `/pack` | The session pack (`?items=` when shared) |

## Three tiers, one interface

The site keeps its three tiers: the **introduction** (the homepage film),
the **elaboration** (`/neoflix`) and the **toolbox** (the library). The
library's interface is already present during the first two, as a small
layer over the page (`ui/LibraryLayer.jsx`). Nobody has to sit through the
story, and the layer assembles itself as the reader **ripens**
(`ripeness.js`):

| Level | Shows | When |
|---|---|---|
| arrived | "Skip ahead" | on arrival |
| curious | the six films as chips, filling in as each is seen; skip to the argument or the toolbox | a film seen, or reaching for the layer |
| oriented | + the paths and a search field | a few films, a quick skip past a section, a quarter of the argument read |
| ready | + the library map with your route, "Open the library" | the end of the intro, most of the argument, or ever having been in the library |

The signals:
- **Films seen.** A clip on screen for a couple of seconds on the homepage
  (`pages/home/story/StorySection.jsx`), or a section of `/neoflix` read for
  a moment. A seen film also lands on the reader's trail.
- **Hurry.** Leaving a story section within a second of arriving, or
  scrolling the argument fast.
- **Reaching for the layer.** Hovering or opening it.
- **Reading depth.** How far into `/neoflix` the reader has scrolled.
- **The library.** Having been in it before.

Ripeness only grows, lives in this browser's localStorage, and is never sent
anywhere. The layer's "?" button shows the reasons in words. The layer sits
outside the page slide (like the navbar), so it carries across from `/` to
`/neoflix`, and it hands over to the library's own chrome at `/toolbox`.

Since the space took over the homepage, the layer only appears on
`/neoflix` and `/contact`.

## Layers

**Node-safe** (the build reads these: routes, sitemap, `scripts/system-check.mjs`)

| | |
|---|---|
| `content/films.js` | The six films: claim, caption, in-practice line, findings (sentences from the papers, each naming its paper), the toolbox pages they lead to, and the time each clip appears in the session film. **The links between films, papers and guidance are written here, once.** |
| `content/papers.js` | What the library says about each paper (short name, asked / found / changed). Bibliographic facts stay in `pages/publications/records.js`. |
| `content/paths.js` | The paths. A step is a record key. |
| `catalog.js` | Builds every record from the toolbox manifest + papers + films. Record keys: `guidance:<slug>`, `paper:<id>`, `film:<id>`. Also the loop (`LOOP`, `loopOfSlug`). |
| `graph.js` | Edges read off the content, and `threadBetween(from, to)`: the sentence that explains a link the reader just followed. |
| `urls.js` | Each record's one address, and back. `?from=` (where the reader came from) and `?path=` (the path being walked) ride in the query string. |
| `modules/plans.js` | **The rules**: which modules a record calls for, their width, their order and the reason for each. Arrival moves things: from a paper, the evidence comes first; from a film, the film. |
| `assemble.js` | Lays the planned modules out in rows of twelve columns. No row is left ragged, and a tall module takes a column of narrow ones beside it. |
| `search.js` | Search: the matches, and the modules a results page calls for. |

**Browser**

| | |
|---|---|
| `library.js` | The catalogue and graph, built once; media URLs |
| `state.js` | Trail, session pack, checklist ticks, your saved path. Stored in localStorage only: no cookies, nothing sent anywhere. |
| `ripeness.js` | How ripe the reader is (see above): the signals, the level and its reasons |
| `modules/index.jsx` | The module components: what each module draws |
| `ui/` | Shapes (one per kind), links that carry `from=`, the map, the local graph, the path bar, the trail dock, the library strip |
| `pages/` | The pack page and its `Shell` |
| `system.css` | All of it, scoped under `.sys` |

## How to…

- **Add a module.** Write its rule in `modules/plans.js`: when it appears, its
  span, its order and its reason. Then add its component to
  `modules/index.jsx` (`MODULES` and `MODULE_NAMES`). The build checks that
  every layout still fills its rows.
- **Link a film to a toolbox page or a finding.** Edit `content/films.js`.
  The map, the local graphs, the threads and the modules all follow.
- **Add a path.** Add it to `content/paths.js`. Its page, route and sitemap
  entry follow; the build fails if a step names a record that doesn't exist.
- **See why a page looks the way it does.** Turn on "Assembly" in the
  library strip. Every module shows its number and its reason.

## Checks

`scripts/system-check.mjs` runs in `build.sh` right after the docs are
compiled. It fails the build if:
- a film points at a toolbox page that was renamed in GitBook;
- a path step doesn't exist;
- an address doesn't map back to its record;
- a drawn link has no explaining sentence;
- any record, from any arrival, assembles a row that isn't twelve columns wide.

## Traps

- **Toolbox text still loads as one bundle** (CLAUDE.md rule 12). The text
  module renders from the manifest at once, and only its body waits.
- **The text module renders inside `.docs-body`**, so `docs.css` and the
  world-map guard (rule 10) still apply.
- **Keep `content/`, `catalog.js`, `graph.js`, `urls.js`, `assemble.js`,
  `search.js` and `modules/plans.js` Node-safe.** No JSON imports, no assets,
  no `import.meta`.
