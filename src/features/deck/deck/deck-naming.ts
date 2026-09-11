import type { Deck, DeckId, DeckName } from "./deck";

/**
 * Two decks whose names differ only in capitalization or surrounding space would look identical in
 * a list, so neither name is free. That is stricter than the unique index behind it. Pass the id of
 * the deck being named to exclude it, so restyling a deck's own name is not a clash with itself.
 */
function isDeckNameTaken(
  name: DeckName,
  existingDecks: readonly Deck[],
  excludedDeckId: DeckId | null,
): boolean {
  const wanted = name.trim().toLowerCase();

  return existingDecks.some(
    (deck) => deck.id !== excludedDeckId && deck.name.trim().toLowerCase() === wanted,
  );
}

export { isDeckNameTaken };
