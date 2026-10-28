#!/bin/bash
# Build the site from src/app.html.
#   tools/build.sh v56            -> live build into the repo root (index.html, sw.js, VERSION)
#   tools/build.sh v56-dev dev    -> dev build into dist-dev/ (separate storage keys, DEV badge)
# The version string is stamped into index.html and sw.js; a changed sw.js is what triggers
# the "Update now" banner for users, so every push to main must carry a new version.
set -e
cd "$(dirname "$0")/.."
V=${1:?usage: tools/build.sh <version> [live|dev]}
CH=${2:-live}
if [ "$CH" = "dev" ]; then OUT=dist-dev; mkdir -p "$OUT"; cp -n manifest.webmanifest icon-192.png icon-512.png "$OUT"/ 2>/dev/null || true
  sed 's/"CNAB \/ CNT Study Lab"/"[DEV] CNAB \/ CNT Study Lab"/; s/"CNAB Lab"/"CNAB Dev"/' manifest.webmanifest > "$OUT/manifest.webmanifest"
else OUT=.; fi
sed "s/__VERSION__/$V/g; s/__CHANNEL__/$CH/g" src/app.html > "$OUT/index.html"
sed "s/__VERSION__/$V/g; s/__CHANNEL__/$CH/g" src/sw.js.tpl > "$OUT/sw.js"
echo "$V" > "$OUT/VERSION"
# standalone copy for file:// use / sharing, when the outputs folder exists (cloud sessions)
if [ -d /mnt/user-data/outputs ]; then
  if [ "$CH" = "dev" ]; then cp "$OUT/index.html" /mnt/user-data/outputs/cnab-lab-dev.html; else cp index.html /mnt/user-data/outputs/cnab-lab-pro.html; fi
fi
echo "built $V ($CH) -> $OUT/"
