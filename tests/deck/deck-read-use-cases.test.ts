import type { DeckFinder } from "@/features/deck/deck/deck-finder";
import type { DeckLister } from "@/features/deck/deck/deck-lister";
import { findDeck } from "@/features/deck/deck/use-cases/find-deck";
import { listDecks } from "@/features/deck/deck/use-cases/list-decks";

const STORE_FAILURE = new Error("The store is unavailable.");

const failingDeckFinder: DeckFinder = { get: () => Promise.reject(STORE_FAILURE) };
const failingDeckLister: DeckLister = { getAll: () => Promise.reject(STORE_FAILURE) };

describe("deck read use cases", () => {
  it("should reject rather than answer when finding a deck fails", async () => {
    await expect(findDeck("ember", { deckFinder: failingDeckFinder })).rejects.toBe(STORE_FAILURE);
  });

  it("should reject rather than answer when listing decks fails", async () => {
    await expect(listDecks({ deckLister: failingDeckLister })).rejects.toBe(STORE_FAILURE);
  });
});
