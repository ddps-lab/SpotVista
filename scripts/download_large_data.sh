#!/bin/bash
# Download the figures/ data archive from GitHub Releases and extract it.
# The archive is split into 2 GiB parts to fit GitHub's per-file release limit.
#
# Usage:
#   ./scripts/download_large_data.sh           # skip if figures/ already populated
#   ./scripts/download_large_data.sh --force   # re-download and overwrite

set -e

REPO="ddps-lab/SpotVista"
TAG="figures-v1"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$ROOT_DIR/.figures-download"

cd "$ROOT_DIR"

if [[ -d "figures" ]] && [[ -n "$(find figures -name '*.csv' -size +100M -print -quit 2>/dev/null)" ]] && [[ "$1" != "--force" ]]; then
  echo "figures/ already contains large data files. Use --force to re-download."
  exit 0
fi

if ! command -v gh >/dev/null 2>&1 && ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: need either 'gh' or 'curl'" >&2
  exit 1
fi

mkdir -p "$TMP_DIR"
cd "$TMP_DIR"

echo "Downloading release $TAG from $REPO..."
if command -v gh >/dev/null 2>&1; then
  gh release download "$TAG" --repo "$REPO" --pattern 'figures.tar.gz.part-*' --clobber
else
  for part in 00 01; do
    url="https://github.com/$REPO/releases/download/$TAG/figures.tar.gz.part-$part"
    echo "  $url"
    curl -L --fail -o "figures.tar.gz.part-$part" "$url"
  done
fi

echo "Extracting into $ROOT_DIR..."
cd "$ROOT_DIR"
cat "$TMP_DIR"/figures.tar.gz.part-* | tar -xzf -

rm -rf "$TMP_DIR"
echo "Done."
