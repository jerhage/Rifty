import type { ReadOptions } from "@/shared/read-options";
import type { Deck } from "../deck";
import type { DeckLister } from "../deck-lister";

type ListDecksResult =
  | { readonly type: "success"; readonly decks: readonly Deck[] }
  | { readonly type: "listFailed" };

interface ListDecksCapabilities {
  readonly deckLister: DeckLister;
}

async function listDecks(
  { deckLister }: ListDecksCapabilities,
  options?: ReadOptions,
): Promise<ListDecksResult> {
  try {
    return { type: "success", decks: await deckLister.getAll(options) };
  } catch {
    return { type: "listFailed" };
  }
}

export { listDecks };
export type { ListDecksCapabilities, ListDecksResult };
