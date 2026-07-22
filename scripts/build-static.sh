#!/usr/bin/env bash
#
# Assemble the deployable static site into dist/.
#
# Dominion is hand-written HTML/JS with no bundler. The CI deploy syncs a
# directory to S3 with `--delete` and NO VCS exclusions, so we must publish a
# clean folder containing only the files the site serves — never the repo root
# (that would push .git/, scripts/, docs/, README.md to the CDN).
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="dist"
rm -rf "$OUT"
mkdir -p "$OUT"

# Pages, scripts, styles, and landing-page metadata (name/description for the
# petterbuilds.com hub). The two HTML files load every top-level *.js, so copy
# them all rather than tracking the list by hand.
cp ./*.html ./*.js ./*.css meta.json "$OUT/"

# Image + audio assets fetched at runtime (card art, background music).
cp -r res "$OUT/res"

echo "✓ Built $OUT/ ($(du -sh "$OUT" | cut -f1)) — $(find "$OUT" -type f | wc -l | tr -d ' ') files"
