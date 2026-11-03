# website/pages/publications/

`/publications` — the list of papers — and `/publications/<paper>`, a page per
paper.

| | |
|---|---|
| `PublicationsPage.jsx` | Picks the surface: laptop (`PublicationsDesktop.jsx`) or phone |
| `PublicationsDesktop.jsx` | The laptop page: the six papers on their time axis — a column per year, each paper in its year, empty years left as holes, Veerle's letter first. Cards open in place. Adding a paper from a new year means adding a column in `publications-board.css`. |
| `arc.js` | What the arc says about each paper: short name, Asked / Found / Changed, the lifted figure, and the intro |
| `PublicationsPhone.jsx` | The phone version |
| `PaperPage.jsx` | One paper's own page |
| `content.js` | The prose on the list page, the PDF links, the download bundle |
| `records.js` | Titles, authors, abstracts, DOIs and licences. Also feeds the paper pages and the structured data search engines read. |
| `PublicationAttachment.jsx`, `PublicationBundle.jsx` | The download cards |

The PDFs themselves are in `public/papers/` — swap a file under the same name
to correct it. Card thumbnails are in `public/previews/`.

`records.js` is also read by a build script running in plain Node, so it must
not use any Vite-only syntax.
