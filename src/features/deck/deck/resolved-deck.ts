import type { Card } from "@/features/card/card";

import { chosenChampionOf } from "./chosen-champion";
import type { Deck, DeckComposition, DeckSection } from "./deck";

/** A deck entry whose printing has been resolved to the card the catalog holds for it. */
interface ResolvedDeckEntry {
  readonly card: Card;
  readonly quantity: number;
  readonly section: DeckSection;
}

/** A deck paired with its cards, so nothing downstream has to look a printing up again. */
interface ResolvedDeck {
  readonly deck: Deck;
  readonly entries: readonly ResolvedDeckEntry[];
  readonly chosenChampionCard: Card | null;
}

/** The saved deck reduced to the shape the deck's own rules read. */
function resolvedComposition({ chosenChampionCard, deck }: ResolvedDeck): DeckComposition {
  return {
    entries: deck.entries,
    chosenChampion: chosenChampionCard === null ? null : chosenChampionOf(chosenChampionCard),
  };
}

export { resolvedComposition };
export type { ResolvedDeck, ResolvedDeckEntry };
