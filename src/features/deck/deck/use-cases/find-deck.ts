import type { ReadOptions } from "@/shared/read-options";
import type { Deck, DeckId } from "../deck";
import type { DeckFinder } from "../deck-finder";

type FindDeckResult =
  | { readonly type: "success"; readonly deck: Deck }
  | { readonly type: "notFound" };

interface FindDeckCapabilities {
  readonly deckFinder: DeckFinder;
}

async function findDeck(
  id: DeckId,
  { deckFinder }: FindDeckCapabilities,
  options?: ReadOptions,
): Promise<FindDeckResult> {
  const deck = await deckFinder.get(id, options);
  return deck ? { type: "success", deck } : { type: "notFound" };
}

export { findDeck };
export type { FindDeckCapabilities, FindDeckResult };
