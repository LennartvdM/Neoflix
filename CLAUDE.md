# CLAUDE.md — working on neoflix.care

This repo is maintained conversationally ("AI as CMS"): the owner describes a
change, you find the right file and make it. This file is the map and the
rulebook. `CONTENT.md` is the content lookup table; `README.md` covers build
and deploy. A full architecture/performance audit lives in `AUDIT.md`
(2026-08; its Phase 0–2 findings are implemented).

## Commands

```bash
cd website && npm run dev     # dev server (builds docs first)
bash build.sh                      # full production build → dist/ + smoke checks
node website/scripts/smoke-check.mjs --out dist   # assertions alone
```

Always run `bash build.sh` before pushing a non-trivial change — it compiles
everything, regenerates route HTML, and runs the smoke assertions.

## Where things live

Most directories carry a `README.md` saying what's in them and which
traps live there — `website/`, `website/pages/`, `website/shared/`,
`website/framer-map/`, `website/scripts/`. Read the one for the directory you're
working in; they're short, and GitHub renders them when browsing too.

- **Everything for one page lives in `pages/<page>/`** — desktop
  surface, phone surface, that page's words and its styles, together.
  `shared/` holds what every page shares (navbar, footer, the backdrop,
  the motion system); `lib/` holds hooks and helpers. See `CONTENT.md`
  for the per-page table. Toolbox content → `docs-content/` markdown (but see the mirror rule).
- **Two surfaces** → each of Home/Neoflix/Publications renders a
  desktop tree or a mobile tree (`< 600px`) — separate lazy chunks.
- **Motion system** → `RouteSlider` (page slide), `BackdropProvider`
  (persistent video backdrop), `ScrollSnap` + `SectionManager` +
  `ScrollSection` (desktop home), `TransitionContext` (shared direction
  state). It is deliberate and documented in-file; read before changing.
- **SEO surface** → `shared/routeMeta.js`, consumed by BOTH
  `hooks/useDocumentMeta.js` (runtime) and `scripts/build-route-html.mjs`
  (build). It must stay **Node-safe**: no `import.meta.env`, no Vite-only
  imports. Same constraint for `pages/publications/records.js`.

## Hard rules

1. **`docs-content/` is a mirror.** A GitHub Action in
   `LennartvdM/NFLX-nieuwe-structuur` overwrites it from GitBook. Edits made
   here can be silently reverted by the next mirror push. Edit docs in
   GitBook, or retire the chain first (decision documented in AUDIT.md §7.1).
2. **`generated/` and `public/docs-assets/` are build output.** Never
   hand-edit; never commit files into them. Hand-placed images belong in
   `public/previews/` or another tracked directory.
3. **Copy changes on the homepage must hit BOTH surfaces.** Desktop
   headlines: `pages/home/story/story.data.js`.
   Phone panels (same sentences, different shape):
   `pages/home/HomePhone.jsx` (`MOBILE_PANELS`). The files
   carry warning comments. `/neoflix` and `/publications` share section
   data between surfaces, but their phone files have their own hero
   strings near the top.
4. **The tagline has one home**: `TAGLINE` in `pages/home/content.js`.
   Never retype the sentence elsewhere.
5. **Naming history trap**: the `/neoflix` page's prose (now
   `pages/neoflix/content.js`) was called `publications.js` until
   2026-08, and old references may linger in conversation history. The real
   `/publications` prose is `pages/publications/content.js`;
   bibliographic facts are `pages/publications/records.js`.
6. **`HOME_CELLS` in `shared/backdrop/BackdropProvider.jsx` mirrors the
   `sections` array in `pages/home/HomeDesktop.jsx` by position.** Changing
   one requires changing the other. The two story sections are named
   `pressure` (the problem: urgency, coordination, tunnel vision) and
   `reflection` (the answer: skills, cohesion, shared understanding).
   That one name is used end to end — the `sections` entry, the `story`
   prop, `STORIES` in `story.data.js`, the decks in
   `shared/backdrop/decks.js` and the `medical-<story>` backdrop keys. **Name
   things for what they are, never for their position or version**: these
   were `'two'`/`'three'`, `MedicalSectionV2`/`V3`, `variant="v2"` and
   `medical-v2` — four names for one thing, none of which said what it
   was.
7. **Media quality is deliberate — measure before you re-encode.**
   A blanket compression pass over these clips was tried and reverted:
   CRF≈30 posterized the gradients (see AUDIT.md). Two clips
   (`blurskills.mp4`, `mobile/neoflix_intro_blur_montage.mp4`) are
   already artefact-free and near-optimally encoded — re-encoding them
   at ANY setting measurably *loses* quality and, for the montage,
   produces a bigger file. Leave them alone.

   The other five backdrop loops went through a deliberate pass that
   exploits the fact that they are heavily blurred by design: an extra
   gaussian blur is imperceptible on already-blurred footage, but it
   is a low-pass filter, so it erases compression artefacts (which are
   high-frequency) and leaves the encoder almost nothing to waste bits
   on. Blur in 10-bit and dither down, so the smoothing doesn't cause
   banding:

   ```bash
   ffmpeg -i in.mp4 -an \
     -vf "format=yuv420p10le,gblur=sigma=2.5,format=yuv420p" \
     -c:v libx264 -preset veryslow -crf 18 \
     -x264-params "aq-mode=3:psy-rd=0.3" \
     -pix_fmt yuv420p -movflags +faststart out.mp4
   ```

   That gained +10.5 to +12.8 dB of artefact-freeness at 33–86% of the
   original size. Before applying it to any clip, measure whether the
   clip needs it — a whole-clip self-vs-blur PSNR under ~60 dB means
   real artefacts, over ~70 dB means it is already clean and you would
   only add generation loss:

   ```bash
   ffmpeg -i clip.mp4 -filter_complex \
     "split[a][b];[a]gblur=sigma=1[ab];[b][ab]psnr" -f null -
   ```

   Never apply this to the sharp foreground clips (`urgency`, `focus`,
   `coordination`, `skills`, `team`, `perspectives`) — blurring real
   detail is visible immediately. Keep the backdrops at 720x426 and the
   foreground clips at their native resolutions.

   Constrained visitors get stills instead of video via
   `utils/reducedMedia.js` (prefers-reduced-motion / Save-Data / low
   device memory). If a clip changes, regenerate its still so the two
   match: `ffmpeg -ss 1.5 -i clip.mp4 -frames:v 1 -c:v libwebp
   -quality 88 stills/<name>.webp`. New media keeps posters and
   `preload="metadata"`. Don't reintroduce a Google Fonts link (fonts
   are self-hosted) and don't remove `dnt=1` from the Vimeo URL.

8. **No cookies, no analytics without an explicit cookieless choice** —
   the site's privacy posture is "no banner needed" and it should stay so.
9. **Netlify config**: there is intentionally NO `/* → /index.html`
   rewrite. Every route is a physical file; unknown paths must 404 via
   `404.html`. New routes need an entry in `routeMeta.js` (that alone makes
   the build emit the HTML and sitemap entry).
10. **Docs typography must not reach into the world map.** The map under
    `framer-map/` is compiled Framer code that injects its own `<style>`
    at runtime, and its rules (`h2.framer-text`) tie on specificity with
    `docs.css`'s (`.docs-body h2`). Whichever the browser injected last
    wins, so the map's appearance depended on how the visitor arrived —
    deep-link the toolbox and Framer won, arrive via the home slide (which
    mounts the same map) and the docs headings hijacked the map's labels.
    `index.css` now restates the component's own declarations, scoped
    to `.worldmap-mount`, one notch more specific than either sheet.
    **Any new bare-element rule under `.docs-body` (`p`, `a`, `ul`, `li`,
    `img`…) can re-open this**: check it doesn't also match Framer markup,
    and extend that block rather than raising `.docs-body`'s specificity.
    Never edit the `framer-map/` chunks — patch from `index.css`.

11. **Page-level overlays portal into the route slide, not `document.body`.**
    `RouteSlider`'s animated wrapper carries `data-route-slide` for this.
    The docs sidebar's active-row tab is portal'd out of the sidebar to
    escape its stacking context; parked on `<body>` it ignored the page
    transition and hung over the incoming page after the sidebar had slid
    away. Anchored in the wrapper it rides the same transform and is
    clipped with the page. Position such overlays from offsets **relative
    to the host**, never viewport coordinates — inside a transformed
    ancestor the two stack and the overlay lands at double the slide
    offset.

12. **The toolbox loads as ONE bundle.** `docsIndex.js` lazily imports a
    single `docs-pages.json` when a visitor enters `/toolbox`; after that
    `getPage` is synchronous. Splitting it per page puts a network round
    trip in front of every click and the whole toolbox visibly reloads;
    eager-importing it puts all 74 pages in the main chunk for every
    visitor on every route. `ToolboxPage` must also never unmount while that
    bundle loads — the nav, titles and neighbours come from the eager
    manifest, so only the article body waits.

## Verifying changes

- `bash build.sh` must pass (includes smoke checks).
- For visual changes, screenshot with Playwright against a static server on
  `dist/` at 1440×900 and 390×844 — mobile and desktop are different trees;
  check the one you touched (or both when the change is shared).
- CI (`.github/workflows/build.yml`) runs the same build on every PR.
