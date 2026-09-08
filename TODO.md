# TODO

- [ ] Use SQLite FTS5 for card search.
- [ ] Bound the catalog's in-memory page cache and refetch pages when scrolling back through large result sets.
- [ ] Store a legend's character tag. Deck building guesses it from the legend's name.
- [ ] Mark champion cards and the legend tag each belongs to.
- [ ] Derive card speed from rules text: `[Action]`, `[Reaction]`, otherwise normal.
- [ ] Count copy limits by card identity in the domain. `deck_card` keys on printing, so alt arts each get their own 3. The builder strips the trailing printing qualifier from the name to group them; storing that identity on the card would be sturdier than parsing it at read time.
- [ ] Fix card identity in the deck builder. Stripping the trailing `(Alternate Art)` misses separator drift: `Sett - Brawler` and `Sett, Brawler` are one card but get separate 3-copy allowances. `cleanName` normalizes both to `Sett Brawler` and looks like the better key.
- [ ] Decide what selecting several domains means in the pool filter. It is any-of today, so a Fury/Order legend opens on both. All-of would instead mean dual-domain cards only, which the catalog query already does natively.
