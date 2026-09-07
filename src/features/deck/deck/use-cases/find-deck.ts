import type { Deck, DeckId } from "../deck";
import type { DeckFinder } from "../deck-finder";

type FindDeckResult =
  | { readonly type: "success"; readonly deck: Deck }
  | { readonly type: "notFound" }
  | { readonly type: "loadFailed" };

interface FindDeckCapabilities {
  readonly deckFinder: DeckFinder;
}

async function findDeck(id: DeckId, { deckFinder }: FindDeckCapabilities): Promise<FindDeckResult> {
  try {
    const deck = await deckFinder.get(id);
    return deck ? { type: "success", deck } : { type: "notFound" };
  } catch {
    return { type: "loadFailed" };
  }
}

export { findDeck };
export type { FindDeckCapabilities, FindDeckResult };
