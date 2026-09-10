import {
  abilityCardCount,
  energyCurve,
  keywordMix,
  speedMix,
  type CurveBucket,
  type KeywordMix,
  type SpeedShare,
} from "@/features/analysis/card-metrics";
import type { Card } from "@/features/card/card";
import type { Deck } from "@/features/deck/deck/deck";

import { MAIN_DECK_SECTIONS, MAIN_DECK_WITH_LEGEND, deckCards } from "./deck-contents";

interface DeckAnalysis {
  readonly abilityCards: number;
  readonly energyBuckets: readonly CurveBucket[];
  readonly keywords: KeywordMix;
  readonly speeds: readonly SpeedShare[];
}

function deckAnalysis(deck: Deck, cards: readonly Card[]): DeckAnalysis {
  const mainDeckCopies = deckCards(deck, cards, MAIN_DECK_SECTIONS);
  const abilityCopies = deckCards(deck, cards, MAIN_DECK_WITH_LEGEND);

  return {
    abilityCards: abilityCardCount(abilityCopies),
    energyBuckets: energyCurve(mainDeckCopies),
    keywords: keywordMix(abilityCopies),
    speeds: speedMix(abilityCopies),
  };
}

export { deckAnalysis };
