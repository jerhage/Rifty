import type { DeckId } from "@/features/deck/deck/deck";

import { linkedDeck } from "./linked-deck";

type DeckToBuild =
  | { readonly type: "newDeck" }
  | { readonly type: "savedDeck"; readonly deckId: DeckId }
  | { readonly type: "unknownDeck" };

function deckToBuild(parameter: string | undefined): DeckToBuild {
  return parameter === undefined ? { type: "newDeck" } : linkedDeck(parameter);
}

export { deckToBuild };
export type { DeckToBuild };
