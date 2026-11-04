# website/pages/publications/

`/publications` — the list of papers — and `/publications/<paper>`, a page per
paper.

| | |
|---|---|
| `PublicationsPage.jsx` | Picks the surface; the laptop version renders through `../../shared/BlogPage.jsx` |
| `PublicationsPhone.jsx` | The phone version |
| `PaperPage.jsx` | One paper's own page |
| `content.js` | The prose on the list page, the PDF links, the download bundle |
| `records.js` | Titles, authors, abstracts, DOIs and licences. Also feeds the paper pages and the structured data search engines read. |
| `PublicationAttachment.jsx`, `PublicationBundle.jsx` | The download cards |

The PDFs themselves are in `public/papers/` — swap a file under the same name
to correct it. Card thumbnails are in `public/previews/`.

`records.js` is also read by a build script running in plain Node, so it must
not use any Vite-only syntax.
