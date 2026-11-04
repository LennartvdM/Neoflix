# website/pages/toolbox/

How toolbox text is loaded and drawn. **The pages themselves are records in
the library** (`website/system/`), which assembles each one; the text
module there renders the page body with `DocsNode`. **The words aren't
here either**: they're markdown in `docs-content/` at the repository root,
mirrored automatically from GitBook. Edit the words in GitBook; edit how
they look here.

| | |
|---|---|
| `DocsNode.jsx` | Turns the compiled markdown into React (task-list items carry `data-task`; the library makes them a working checklist) |
| `blocks/` | GitBook's own block types: callouts, tabs, cards, file downloads, the world map embed |
| `docsIndex.js` | The manifest and the page loader |
| `docs.css` | Everything the reader looks like |
| `legacySlugMap.js`, `legacyGitbookUrls.js` | Redirects from two earlier generations of Toolbox URLs, so old links still work. Not content — don't add rows. |

Two rules from `CLAUDE.md` apply here in particular: the whole toolbox loads
as **one** bundle (rule 12 — splitting it per page makes it visibly reload on
every click), and bare-element CSS under `.docs-body` can leak into the
embedded world map (rule 10).
