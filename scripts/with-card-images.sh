#!/bin/sh
# Serves data/images for the duration of the command, and names this machine as the image host so a
# device build reaches it rather than asking itself.
set -eu

python3 -m http.server 8787 --directory data/images >/dev/null 2>&1 &
IMAGES=$!
trap 'kill $IMAGES 2>/dev/null || true' EXIT INT TERM

LAN=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
if [ -n "$LAN" ]; then
  export EXPO_PUBLIC_CARD_IMAGE_HOST="$LAN"
fi

"$@"
