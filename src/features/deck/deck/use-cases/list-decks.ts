import type { Deck } from "../deck";
import type { DeckLister } from "../deck-lister";

type ListDecksResult =
  | { readonly type: "success"; readonly decks: readonly Deck[] }
  | { readonly type: "listFailed" };

interface ListDecksCapabilities {
  readonly deckLister: DeckLister;
}

async function listDecks({ deckLister }: ListDecksCapabilities): Promise<ListDecksResult> {
  try {
    return { type: "success", decks: await deckLister.getAll() };
  } catch {
    return { type: "listFailed" };
  }
}

export { listDecks };
export type { ListDecksCapabilities, ListDecksResult };
