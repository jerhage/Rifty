import type { ReadOptions } from "@/shared/read-options";
import type { Deck } from "../deck";
import type { DeckLister } from "../deck-lister";

type ListDecksResult = { readonly type: "success"; readonly decks: readonly Deck[] };

interface ListDecksCapabilities {
  readonly deckLister: DeckLister;
}

async function listDecks(
  { deckLister }: ListDecksCapabilities,
  options?: ReadOptions,
): Promise<ListDecksResult> {
  return { type: "success", decks: await deckLister.getAll(options) };
}

export { listDecks };
export type { ListDecksCapabilities, ListDecksResult };
