# TODO

- [ ] Use SQLite FTS5 for card search.
- [ ] Bound the catalog's in-memory page cache and refetch pages when scrolling back through large result sets.
- [ ] Store a legend's character tag. Deck building guesses it from the legend's name.
- [ ] Mark champion cards and the legend tag each belongs to.
- [ ] Derive card speed from rules text: `[Action]`, `[Reaction]`, otherwise normal.
- [ ] Count copy limits by card identity in the domain. `deck_card` keys on printing, so alt arts each get their own 3. The builder strips the trailing printing qualifier from the name to group them; storing that identity on the card would be sturdier than parsing it at read time.
- [ ] Fix card identity in the deck builder. Stripping the trailing `(Alternate Art)` misses separator drift: `Sett - Brawler` and `Sett, Brawler` are one card but get separate 3-copy allowances. `cleanName` normalizes both to `Sett Brawler` and looks like the better key.
- [ ] Decide what selecting several domains means in the pool filter. It is any-of today, so a Fury/Order legend opens on both. All-of would instead mean dual-domain cards only, which the catalog query already does natively.
- [ ] Make Metro notice migration SQL changes. `babel-plugin-inline-import` bakes each `.sql` file into `migrations.js` at transform time, and Metro does not track it as a dependency, so editing a migration serves stale SQL until `npm run start:clear`. A `metro.config.js` cache key covering `drizzle/**/*.sql` would fix it.
- [ ] Convert the leftover card art to webp. 183 cards have no webp source and download as ~923 KB png, over half the local image directory; the rest average 98 KB. Convert with cwebp or ffmpeg after `npm run fetch:card-images` and drop png entirely.
- [ ] Store the regions we know about instead of only the ones cards admit to. Tag kinds come from the union of every card's `regions[]`, which finds 11 but never mentions Mount Targon, The Void, Icathia or Kathkan, so those land as traits. Runeterra's regions are a known fixed list and worth persisting even when no card lists them.
