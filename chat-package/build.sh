#!/usr/bin/env bash
# Build the package for a Claude chat session (see START-HERE.md).
#   bash chat-package/build.sh [out-dir]
# Needs a finished `bash build.sh` (generated/ and dist/), ffmpeg and
# Playwright. Leaves <out-dir>/neoflix-chat-package.zip.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-chat-package/out}"
PKG="$OUT/neoflix-chat-package"
rm -rf "$PKG" "$OUT/neoflix-chat-package.zip"
mkdir -p "$PKG"

# 1. The material as JSON, computed by the site's own modules.
node chat-package/export-data.mjs "$PKG/data"

# 2. Images as small data URIs (artifacts can't load files).
TH="$(mktemp -d)"
for f in website/public/videos/stills/*.webp website/public/videos/session/*.webp; do
  ffmpeg -v error -y -i "$f" -vf scale=480:-2 -c:v libwebp -quality 62 "$TH/$(basename "$(dirname "$f")")-$(basename "$f")"
done
python3 - "$TH" "$PKG/data/media-inline.json" <<'PY'
import base64, json, os, sys
d, out = sys.argv[1], sys.argv[2]
imgs = {}
for f in sorted(os.listdir(d)):
    k = f[:-5].replace('stills-', 'still:').replace('session-', 'frame:')
    imgs[k] = 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(d, f), 'rb').read()).decode()
json.dump({'about': '480px webp thumbnails as data URIs, for artifacts (which cannot load files or most external images). still:<film> = the six films and their blurred twins; frame:pNNN = session-film keyframes (see session-film.json frames).', 'images': imgs}, open(out, 'w'))
PY
rm -rf "$TH"

# 3. The code (committed state), minus large media, listed instead.
mkdir -p "$PKG/source"
git archive HEAD | tar -x -C "$PKG/source"
(
  cd "$PKG/source"
  sel=(-type f \( -name '*.mp4' -o -name '*.pptx' -o -name '*.pdf' -o -path './docs-content/.gitbook/assets/*' \))
  {
    echo "# Left out of this package (size limits; nothing here is needed to read or change the code)"
    echo
    echo "Restore by copying them from the repository (LennartvdM/Neoflix) into the same paths. The build runs without them; pages that play a clip or offer a PDF will 404 on it."
    echo
    echo '| File | Bytes |'; echo '|---|---|'
    find . "${sel[@]}" -printf '| `%P` | %s |\n' | sort
  } > ../MISSING-MEDIA.md
  find . "${sel[@]}" -delete
  find . -type d -empty -delete
)

# 4. Screenshots of the current site.
python3 -m http.server 4179 -d dist >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
sleep 1
node chat-package/screens.cjs http://localhost:4179 "$PKG/screens"
for f in "$PKG"/screens/*.png; do ffmpeg -v error -y -i "$f" -q:v 3 "${f%.png}.jpg" && rm "$f"; done

# 5. The guide, the owner's direction, the starter.
cp chat-package/START-HERE.md chat-package/DIRECTION.md "$PKG/"
mkdir -p "$PKG/starter" && cp chat-package/starter/*.jsx "$PKG/starter/"

(cd "$OUT" && zip -qr neoflix-chat-package.zip neoflix-chat-package)
du -h "$OUT/neoflix-chat-package.zip"
