# neoflix.care

This repository is the website at **https://neoflix.care** — everything on it
except the Toolbox text, which is written in GitBook (see below).

Neoflix is interprofessional video review of real neonatal procedures,
developed at the Department of Neonatology, Leiden University Medical Center.

---

## Changing something on the site

The site is maintained by asking an AI assistant, in plain language. You don't
need to know which file anything is in — describe what you can see on the page
and what you want it to say instead:

> "On the homepage, the line 'Quiet reflection allows for sharpening skills'
> should read '…' instead."

> "Swap the photo on the Publications page for the one I just added."

**`CONTENT.md` is the map** from what you see on the site to the file it lives
in. It's the most useful file here, and it's worth pointing the assistant at it
when you start: *"read CONTENT.md first."*

Two things are worth knowing before you ask:

- **The Toolbox is written in GitBook, not here.** Everything under
  `/toolbox` on the site comes from GitBook and is copied into this repository
  automatically. Editing it here doesn't work — the next copy overwrites it.
  Edit those pages in GitBook and they appear on the site by themselves.
- **The homepage says everything twice.** Phones get a different layout from
  laptops, so a sentence on the homepage exists in two places. The assistant
  knows this (it's written down in `CLAUDE.md`), but if a change shows up on
  your laptop and not your phone, that's why — say so and it'll fix the other one.

### Seeing a change before it goes live

Anything merged into the `main` branch goes live within a couple of minutes.
If you'd rather look first, ask the assistant to *"open this as a pull request
instead of merging it"*. Netlify then builds a **preview link** — a complete
copy of the site with your change, at its own URL — and posts it on the pull
request. Click it, look at the page, and merge when you're happy.

### When something goes wrong

- **The site still looks fine but your change didn't appear.** The build
  probably failed, which means the old site stays up — nothing is broken.
  Open Netlify, look at the failed deploy's log, and paste the error to the
  assistant.
- **The change appeared and it's wrong.** In Netlify, open **Deploys**, find
  the last deploy that was good, and choose **Publish deploy**. The site
  reverts immediately. Then fix it properly at your leisure.

### The four files at the top of this repository

| File | Who it's for |
|---|---|
| `README.md` | You — this file |
| `CONTENT.md` | You — "I want to change X" → the file it's in |
| `CLAUDE.md` | The AI assistant — the rules and traps it must respect |
| `AUDIT.md` | Developers — the 2026-08 review of the codebase and what's still open |

---

## For developers

React 18 + Vite 4 + Tailwind 3 + framer-motion 10, React Router 6. A single-page
app that also emits a real HTML file per route at build time, deployed on Netlify.

### Requirements

**Node 22.** Netlify (`netlify.toml`) and CI both pin it, and the build runs
`npm ci`, so a different major will either fail the install or produce a build
that doesn't match production.

### Quick start

```bash
cd website
npm ci                       # npm install also works; CI and Netlify use ci
npm run dev                  # http://localhost:5173
```

`npm run dev` runs two build steps first (`predev`): it compiles `docs-content/`
into the toolbox's JSON, and bundles the publication PDFs into a zip. Both write
into ignored output directories — see *Generated output* below.

Full production build — exactly what Netlify runs:

```bash
bash build.sh                # from the repo root → dist/, then smoke checks
```

Run the post-build assertions on their own:

```bash
node website/scripts/smoke-check.mjs --out dist
```

**Run `bash build.sh` before pushing anything non-trivial.** It compiles
everything, regenerates the per-route HTML, and runs seven assertions that catch
the structural breakage a compile can't see (missing share image, a route with
no HTML file, an empty sitemap, a stray Google Fonts link).

### Repo layout

Most directories carry their own `README.md` explaining what's in them; GitHub
shows it when you open the folder.

| Path | What it is |
|---|---|
| `website/` | The site's source — see `website/README.md` |
| `website/pages/<page>/` | **One folder per page of the website**, holding both surfaces, that page's words and its styles |
| `website/shared/` | What every page shares: navbar, footer, the video backdrop, the motion system, per-page SEO |
| `website/lib/` | Hooks and small helpers |
| `website/framer-map/` | The world map, exported from Framer. Vendored — patch via CSS, never edit the chunks. |
| `website/scripts/` | The four build steps |
| `website/public/` | Media served as-is: videos, stills, paper PDFs, fonts, icons |
| `docs-content/` | **Mirrored** GitBook markdown for `/toolbox`. Pushed here by a GitHub Action in `LennartvdM/NFLX-nieuwe-structuur`. Never hand-edit. |
| `netlify.toml` | Node version, security headers (strict CSP), caching. Deliberately no SPA rewrite — see below. |
| `build.sh` | The one build entrypoint |
| `.github/workflows/build.yml` | CI: runs `build.sh` on every PR and on pushes to `main` |

#### Generated output — never commit, never hand-edit

| Path | Written by |
|---|---|
| `dist/` | `build.sh` (gitignored) |
| `website/generated/` | `scripts/build-docs.mjs` — the compiled toolbox pages |
| `website/public/docs-assets/` | `scripts/build-docs.mjs` — GitBook images and attachments |
| `website/public/papers/neoflix-publications.zip` | `scripts/build-publications-zip.mjs` |

Hand-placed images belong in `public/previews/` or another tracked directory —
anything dropped into the paths above is overwritten on the next build.

### Two surfaces

Home, `/neoflix` and `/publications` each render **either a desktop tree or a
phone tree**, forked at `600px`, as separate lazy chunks. They are different
components, not one responsive layout.

The practical consequence: **a copy change on the homepage has to be made
twice** — desktop headlines live in `pages/home/story/story.data.js`, the same
sentences in phone shape live in `MOBILE_PANELS` in `pages/home/HomePhone.jsx`.
Both files carry warning comments. `CONTENT.md` lists which pages share their section data and
which don't.

### How routing and deploys work

Every real route gets a **physical HTML file** with its own title, description,
canonical and OG tags (`scripts/build-route-html.mjs`, driven by
`shared/routeMeta.js`). Adding a route to `routeMeta.js` is what makes the
build emit its HTML and its sitemap entry.

Legacy toolbox URLs 301 via the generated `_redirects` (two generations of
them). Anything else falls through to `404.html` — which is the app shell, so
visitors see the styled not-found page while crawlers get a genuine 404 status.
That only works because there is **no `/* → /index.html` rewrite** in
`netlify.toml`; don't add one.

Pushing to `main` triggers the Netlify build. Editing the docs in GitBook
triggers the mirror Action in the other repo, which pushes `docs-content/` here,
which triggers a rebuild.

`scripts/build-docs.mjs` publishes **only the GitBook assets that pages actually
reference**. Unreferenced uploads in the GitBook space never reach the public site.

### Media

The video encodes are deliberate and were arrived at by measurement — a blanket
compression pass was tried and reverted because it posterized the gradients.
**`CLAUDE.md` rule 7 is the rulebook: read it before re-encoding anything**,
including which clips are already optimal and must be left alone.

Visitors who ask for less get less: `lib/utils/reducedMedia.js` swaps the backdrop
videos for stills when the browser reports `prefers-reduced-motion`, Save-Data,
or low device memory. Every clip therefore has a matching still in
`public/videos/stills/` — if a clip changes, regenerate its still so the two
agree. The stills look unreferenced to a plain text search because their paths
are built at runtime from the clip's filename.

### Privacy

- **No cookies, no analytics, nothing that needs a consent banner.** Keep it
  that way: if analytics are ever wanted, it has to be a cookieless option.
  GoatCounter (free) and Netlify Analytics ($9/mo, zero client JS) are the
  shortlisted candidates. Still an open decision — `AUDIT.md` §6.2.
- Inter and Montserrat are **self-hosted** (`public/fonts/`,
  `shared/fonts.css`). Don't reintroduce a Google Fonts `<link>` — the CSP
  forbids it and a smoke check fails the build if one appears.
- The only third-party iframe is the Vimeo player, and its URL carries `dnt=1`.
  Don't remove it.

### Netlify

- Build command `bash build.sh`, publish directory `dist`, Node 22 — all set in
  `netlify.toml`, not in the Netlify UI.
- **No environment variables are required.** `GITHUB_TOKEN` and `UPLOAD_SECRET`
  belonged to an upload tool that has been removed; delete them in the Netlify
  UI and revoke the GitHub PAT if either is still there.

### Verifying a change

1. `bash build.sh` must pass — it includes the smoke checks.
2. For visual changes, screenshot against a static server on `dist/` at 1440×900
   and 390×844. The two surfaces are different trees: check the one you touched,
   or both when the change is shared.
3. CI runs the same build on every PR.
