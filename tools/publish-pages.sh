#!/usr/bin/env bash
# Publish the current build to GitHub Pages (the public tester link).
# Usage: bash tools/publish-pages.sh   (from the repository root, after tests pass)
# Link: https://filipsentimentscope.github.io/sahil-ages-of-arabia/
set -euo pipefail
npm run build
SRC=$(git rev-parse --short HEAD)
TMP=$(mktemp -d)
git worktree add --detach "$TMP" >/dev/null
cd "$TMP"
git checkout --orphan gh-pages-new >/dev/null 2>&1
git rm -rfq . >/dev/null 2>&1 || true
cp -r "$OLDPWD/dist/." .
touch .nojekyll
git add -A
git commit -qm "Playable build for testers (from main $SRC)"
git push -q -f origin HEAD:gh-pages
cd "$OLDPWD"
git worktree remove --force "$TMP"
git branch -D gh-pages-new >/dev/null 2>&1 || true
echo "Published $SRC to https://filipsentimentscope.github.io/sahil-ages-of-arabia/ (live in about a minute)"
