# TODO

- [ ] Use SQLite FTS5 for card search.
- [ ] Bound the catalog's in-memory page cache and refetch pages when scrolling back through large result sets.
- [ ] Store a legend's character tag. Deck building guesses it from the legend's name.
- [ ] Mark champion cards and the legend tag each belongs to.
- [x] Derive card speed from rules text: `[Action]`, `[Reaction]`, otherwise normal.
- [x] Count copy limits by card identity in the domain. `deck_card` keys on printing, so alt arts each get their own 3. The builder strips the trailing printing qualifier from the name to group them; storing that identity on the card would be sturdier than parsing it at read time.
- [ ] Fix card identity in the deck builder. Stripping the trailing `(Alternate Art)` misses separator drift: `Mel, Newly Awakened` and `Mel - Newly Awakened` are one card across VEN and OPP but get separate 3-copy allowances. 19 such groups today, and it will grow rather than settle, since the VEN feed uses commas throughout while the card API uses dashes. `cleanName` is not the fix: it keeps the qualifier in all 274 qualified printings, so it would split 174 identity groups over 501 printings and hand every alternate art its own allowance again. Derive the identity in `card-derivation.ts` and store it on the card, splitting on `NAME_SEPARATOR` the way `championName` already does.
- [ ] Decide what selecting several domains means in the pool filter. It is any-of today, so a Fury/Order legend opens on both. All-of would instead mean dual-domain cards only, which the catalog query already does natively.

- [ ] Consider an `AnalyzedCard` interface in the analysis feature. Analysis imports the whole `Card` aggregate but reads about six fields of it, so it is coupled to churn in fields it never touches. Declaring the narrow shape it needs would decouple them for free: TypeScript is structurally typed, so `Card` satisfies it with no mapping code and no second model to keep in sync. Not worth doing while the catalog is the only source of cards. The trigger is a second one, such as meta or tournament decklists arriving from an API with their own card shape, at which point this becomes the anticorruption layer between them.

- [ ] Widen keyword scope beyond `self` / `other`. The derivation already distinguishes finer targets and flattens them: `[Stun] an enemy unit`, `[Buff] a friendly unit`, `Other friendly units here have [Shield]`, `choose an opponent. They [Burn 3]`, and `[Add]` into your own pool are at least four targets collapsed into two values. Widening means re-deriving every row and revisiting anything that branches on scope, so it wants its own pass. The phrase lists in `.local/keyword-targeting.md` already separate these cases — they just map several onto one value.

- [ ] Make Metro pick up migration SQL changes. Right now, `babel-plugin-inline-import` embeds `.sql` files into `migrations.js`, but Metro doesn't know those files are dependencies. This means migration changes can stay stale until running `npm run start:clear`. Add the files under `drizzle/**/*.sql` to Metro's cache key so changes are picked up automatically.

- [x] Convert the remaining card art to WebP.

- [ ] Store the full list of known regions. We're currently building the region list from the `regions[]` values found on cards. That gives us 11 regions, but misses Mount Targon, The Void, Icathia, and Kathkan, causing them to be treated as traits instead. Since Runeterra's regions are a known, fixed list, store that list directly rather than relying on cards to tell us which regions exist.

- [ ] Change testing to use local `__tests__` directories
- [ ] Add better test coverage, especially for usecases and ui hooks

## Deck analytics

Each of these works off data we already store. Take them one at a time.

- [ ] Offer both draw horizons in the draw odds panel as a toggle. Cards seen by turn 3 is 6 on the play and 7 on the draw, since the starting player skips their first draw. We show 6 today and label it only as "by T3", which hides which side of the table it assumes.
- [ ] Draw simulation. Hypergeometric odds of opening a given card or count from the 40.
- [x] Proactive vs reactive split, from `card_speed`.
- [x] Keyword density, from `card_keyword` including the numeric values.
- [ ] Might curve and total power, alongside the energy curve.
- [ ] Trait density, using `tag.kind = 'trait'` so Poro no longer counts as Piltover.
- [ ] Copy distribution. How much of the deck is 1-of, 2-of, 3-of.
- [ ] Rarity mix.
