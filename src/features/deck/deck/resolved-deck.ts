import type { CardCopy } from "@/features/analysis/card-copy";
import type { Card } from "@/features/card/card";

import type { Deck, DeckSection } from "./deck";

/** A deck entry whose printing has been resolved to the card the catalog holds for it. */
interface ResolvedDeckEntry extends CardCopy {
  readonly section: DeckSection;
}

/** A deck paired with its cards, so nothing downstream has to look a printing up again. */
interface ResolvedDeck {
  readonly deck: Deck;
  readonly entries: readonly ResolvedDeckEntry[];
  readonly chosenChampionCard: Card | null;
}

export type { ResolvedDeck, ResolvedDeckEntry };
