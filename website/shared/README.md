# website/shared/

Everything used by more than one page. If something belongs to a single page,
it goes in that page's folder instead.

| | |
|---|---|
| `Navbar.jsx`, `Footer.jsx` | The chrome at the top and bottom of every page |
| `MobileDock.jsx` | The bar along the bottom on phones |
| `routeMeta.js` | Browser tab titles, search snippets and link-preview cards, per page. Adding a route here is what makes the build emit its HTML file and sitemap entry. |
| `BlogPage.jsx` | The long-form article layout, shared by `/neoflix` and `/publications` |
| `IllustrationClip.jsx` | The video player used for decorative clips, with the still-image fallback |
| `ErrorBoundary.jsx` | Catches a crash and shows a page instead of a blank screen |
| `motion/` | Page transitions and the scroll-snap machinery |
| `backdrop/` | The video playing behind every route |
| `worldmap/` | The world map, used by the homepage and inside Toolbox pages |
| `fonts.css` | The self-hosted webfonts |

`routeMeta.js` is also read by a build script running in plain Node, so it must
not use any Vite-only syntax.

`motion/` and `backdrop/` are deliberate and heavily commented — read the file
headers before changing how anything moves. `HOME_CELLS` in
`backdrop/BackdropProvider.jsx` mirrors the homepage's slide list by position;
changing one means changing the other.
