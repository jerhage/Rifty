#!/bin/sh
set -eu

OUT=${1:-data/catalog-snapshot.db}

DB=$(find "$HOME/Library/Developer/CoreSimulator/Devices" \
  -name catalog.db -path '*riftcards*' 2>/dev/null | head -1)

if [ -z "$DB" ]; then
  echo "No catalog.db found. Boot the simulator and open the app at least once." >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"
rm -f "$OUT"
sqlite3 "$DB" "VACUUM INTO '$(cd "$(dirname "$OUT")" && pwd)/$(basename "$OUT")'"

echo "$DB"
echo "-> $OUT"
sqlite3 "$OUT" "select 'cards', count(*) from catalog_card
  union all select 'keywords', count(*) from card_keyword
  union all select 'speeds', count(*) from card_speed
  union all select 'decks', count(*) from deck
  union all select 'seed version', substr(version, 1, 12) from catalog_seed_state;"
