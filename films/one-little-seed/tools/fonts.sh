#!/bin/sh
# Self-hosted SIL OFL 1.1 handwritten fonts with full Latin + Vietnamese diacritics.
set -e
D=$(cd "$(dirname "$0")/.." && pwd)/fonts
mkdir -p "$D"
GF=https://raw.githubusercontent.com/google/fonts/86aced91de05cd4f96a06838124cca45be337b2b
get() {
  [ -s "$D/$1" ] && [ -z "$FORCE" ] && return 0
  curl -fsSL -g --retry 2 -o "$D/download.part" "$2" || {
    rm -f "$D/download.part"
    echo "✗ could not fetch fonts/$1 from $2" >&2
    exit 1
  }
  mv "$D/download.part" "$D/$1"
  echo "fonts/$1"
}
get PatrickHand-Regular.ttf "$GF/ofl/patrickhand/PatrickHand-Regular.ttf"
get Mali-SemiBold.ttf "$GF/ofl/mali/Mali-SemiBold.ttf"
get Mali-Bold.ttf "$GF/ofl/mali/Mali-Bold.ttf"
