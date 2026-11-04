# CONTENT.md — "I want to change X" → edit Y

Look up what you can see on the site; this tells you the file it lives in.
Paths are under `website/` unless noted. After editing, `bash build.sh` from
the repository root must pass.

**Everything for one page lives in that page's folder.** If you only remember
one thing, remember that: the Publications page is `pages/publications/`, the
homepage is `pages/home/`, and so on. Each folder holds the desktop version,
the phone version, that page's words and that page's styles, side by side.

## Homepage — `pages/home/`

| What you see | Where it lives |
|---|---|
| Tagline under the logo ("Improve patient care…") | `TAGLINE` in `pages/home/content.js` (one string, used everywhere) |
| The animated "Record / Reflect / Refine" words | `pages/home/intro/RecordReflectRefine.jsx` (`WORDS`) |
| The two story sections' headlines, captions, carousel copy | `pages/home/story/story.data.js` — keyed `pressure` (the problem) and `reflection` (the answer). **Also update the phone version, next row.** |
| The same sentences on a phone | `MOBILE_PANELS` in `pages/home/HomePhone.jsx` — **keep in step with `story.data.js`** |
| Story section videos | `public/videos/*.mp4`, mapped in `story.data.js`. Replacing a clip? Read CLAUDE.md rule 7 first, and regenerate its still in `public/videos/stills/`. |
| Phone hero lines + label | top of `pages/home/HomePhone.jsx` |
| Phone panel videos/posters | `public/videos/mobile/` |
| The showcase video slide | `pages/home/VimeoSection.jsx` |
| The world map slide | `shared/worldmap/` (shared with the Toolbox) |
| Footer names, credits, KNAW funding line | `shared/Footer.jsx` |

## /neoflix (and /contact, which is the same page) — `pages/neoflix/`

| What you see | Where it lives |
|---|---|
| All section prose + titles (both desktop and phone) | `pages/neoflix/content.js` |
| Phone-only hero ("Record. Reflect. Refine." + subtitle, intro band) | `pages/neoflix/NeoflixPhone.jsx` — search the file for the sentence you want to change |
| Section backdrop videos / accent colours | `pages/neoflix/backdrop.js` (desktop); map at the top of `NeoflixPhone.jsx` (phone) |

## /publications — `pages/publications/`

| What you see | Where it lives |
|---|---|
| Section prose, PDF links, bundle | `pages/publications/content.js` |
| Titles, authors, abstracts, DOIs, licences (also feeds paper pages + search-engine data) | `pages/publications/records.js` |
| The PDFs themselves | `public/papers/` (swap a file under the same name to correct it) |
| Preview thumbnails on article cards | `public/previews/` |
| Phone-only hero ("Articles" + subtitle) | `pages/publications/PublicationsPhone.jsx` — search for `<h1>Articles</h1>` |

## /toolbox (the guide) — `pages/toolbox/`

The **text** of every Toolbox page is markdown in `docs-content/` at the
repository root — **but that directory is mirrored from GitBook** (repo
`LennartvdM/NFLX-nieuwe-structuur`). Edit in GitBook, or retire the mirror
first (AUDIT.md §7.1). Only images and files actually linked from a page are
published.

`pages/toolbox/` is the *reader* — the sidebar, the page layout, and the
blocks that render GitBook's callouts, tabs, cards and file links. Change
things here to alter how Toolbox pages look, not what they say.

## Browser tab titles, search snippets, link previews

| What | Where |
|---|---|
| Title + description per page (Google, LinkedIn cards) | `shared/routeMeta.js` |
| The share image | `public/og-preview.png` (commit a new 1200×630 PNG under the same name) |
| Favicon / app icons | `public/favicon.svg` + PNGs in `public/` |

## Things shared by every page — `shared/`

| What you see | Where it lives |
|---|---|
| The top navigation bar | `shared/Navbar.jsx` |
| The footer | `shared/Footer.jsx` |
| The bar along the bottom on phones | `shared/MobileDock.jsx` |
| The video playing behind everything | `shared/backdrop/` |
| The way pages slide when you navigate | `shared/motion/` |

## Adding a page

Add the route in `App.jsx`, an entry in `shared/routeMeta.js` (this also
puts it in the sitemap and gives it its own HTML file), a folder for it under
`pages/`, and a link in `shared/Navbar.jsx` or `shared/Footer.jsx` if it should be
reachable from the chrome.
