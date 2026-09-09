# TODO

- [ ] Use SQLite FTS5 for card search.
- [ ] Bound the catalog's in-memory page cache and refetch pages when scrolling back through large result sets.
- [ ] Store a legend's character tag. Deck building guesses it from the legend's name.
- [ ] Mark champion cards and the legend tag each belongs to.
- [x] Derive card speed from rules text: `[Action]`, `[Reaction]`, otherwise normal.
- [x] Count copy limits by card identity in the domain. `deck_card` keys on printing, so alt arts each get their own 3. The builder strips the trailing printing qualifier from the name to group them; storing that identity on the card would be sturdier than parsing it at read time.
- [ ] Fix card identity in the deck builder. Stripping the trailing `(Alternate Art)` misses separator drift: `Sett - Brawler` and `Sett, Brawler` are one card but get separate 3-copy allowances. `cleanName` normalizes both to `Sett Brawler` and looks like the better key.
- [ ] Decide what selecting several domains means in the pool filter. It is any-of today, so a Fury/Order legend opens on both. All-of would instead mean dual-domain cards only, which the catalog query already does natively.

- [ ] Make Metro pick up migration SQL changes. Right now, `babel-plugin-inline-import` embeds `.sql` files into `migrations.js`, but Metro doesn't know those files are dependencies. This means migration changes can stay stale until running `npm run start:clear`. Add the files under `drizzle/**/*.sql` to Metro's cache key so changes are picked up automatically.

- [x] Convert the remaining card art to WebP.

- [ ] Store the full list of known regions. We're currently building the region list from the `regions[]` values found on cards. That gives us 11 regions, but misses Mount Targon, The Void, Icathia, and Kathkan, causing them to be treated as traits instead. Since Runeterra's regions are a known, fixed list, store that list directly rather than relying on cards to tell us which regions exist.

- [ ] Change testing to use local `__tests__` directories
- [ ] Add better test coverage, especially for usecases and ui hooks

## Deck analytics

Each of these works off data we already store. Take them one at a time.

- [ ] Draw simulation. Hypergeometric odds of opening a given card or count from the 40.
- [x] Proactive vs reactive split, from `card_speed`.
- [x] Keyword density, from `card_keyword` including the numeric values.
- [ ] Might curve and total power, alongside the energy curve.
- [ ] Trait density, using `tag.kind = 'trait'` so Poro no longer counts as Piltover.
- [ ] Copy distribution. How much of the deck is 1-of, 2-of, 3-of.
- [ ] Rarity mix.
