# website/shared/

Everything used by more than one page. If something belongs to a single page,
it goes in that page's folder instead.

| | |
|---|---|
| `Navbar.jsx`, `Footer.jsx` | The chrome at the top and bottom of every page |
| `MobileDock.jsx` | The bar along the bottom on phones |
| `routeMeta.js` | Browser tab titles, search snippets and link-preview cards, per page. Adding a route here is what makes the build emit its HTML file and sitemap entry. |
| `argument.js` | The six beats — every claim, proof and door of the argument. The homepage and `/neoflix` read it. |
| `index/` | What holds the site together. The site is three sets of things — six beats, five loop parts, six papers — and every page is its own interface onto them. A thing is a token (`beat:cost`, `loop:reflect`, `paper:providers`), drawn the same everywhere by `Token.jsx`. The navbar is the index of all three sets and lights what the reader is looking at (pages publish it with `useLit`) and what it relates to (`relations.js`, read off `argument.js`); hovering a token marks its mentions on the page; clicking one carries it (`carry.js`) to its `data-token-anchor` on the page that owns it. |
| `board/` | The design language: the grid, the seven hooks (claim, proof, witness, instrument, instruction, exit, orientation), their motion, the film door. `/neoflix` and `/publications` are compositions of these. |
| `IllustrationClip.jsx` | The video player used for decorative clips, with the still-image fallback |
| `ErrorBoundary.jsx` | Catches a crash and shows a page instead of a blank screen |
| `motion/` | Page transitions and the scroll-snap machinery |
| `backdrop/` | The video playing behind every route |
| `worldmap/` | The world map, used on `/neoflix` and inside Toolbox pages |
| `fonts.css` | The self-hosted webfonts |

`routeMeta.js` is also read by a build script running in plain Node, so it must
not use any Vite-only syntax.

`motion/` and `backdrop/` are deliberate and heavily commented — read the file
headers before changing how anything moves. `HOME_CELLS` in
`backdrop/BackdropProvider.jsx` mirrors the homepage's slide list by position;
changing one means changing the other.
