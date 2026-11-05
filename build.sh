#!/usr/bin/env bash
set -e

echo "=== neoflix.care build ==="

OUT="dist"
rm -rf "$OUT"

# docs-content/ is mirrored into this repo by a GitHub Action in
# LennartvdM/NFLX-nieuwe-structuur (.github/workflows/mirror.yml).
# It lives here as regular tracked files. Do not edit by hand.

cd website
# Strict install: if the lockfile and package.json disagree, fail loudly
# instead of silently resolving fresh versions on a production build.
npm ci --prefer-offline
# Transform docs-content/ (GitBook mirror) → compiled AST JSON + assets
node scripts/build-docs.mjs
# The papers as readings / synopses → generated/readings-index.json
node scripts/build-readings.mjs
# The library's integrity: links, paths, addresses, layouts (fails fast,
# naming what broke — e.g. a toolbox page renamed in GitBook)
node scripts/system-check.mjs
# Bundle public/papers/*.pdf → one archive + its manifest
node scripts/build-publications-zip.mjs
npx vite build --outDir "../$OUT"
# Give each route its own HTML head (+ sitemap, robots.txt). Must run
# after vite build — it rewrites the emitted index.html per route.
node scripts/build-route-html.mjs --out "../$OUT"
# Post-build assertions: og image present, every route emitted,
# sitemap/404/_redirects/fonts in place. Fails the deploy if not.
node scripts/smoke-check.mjs --out "../$OUT"
cd ..

echo "=== Build complete → $OUT/ ==="
ls -la "$OUT/"
