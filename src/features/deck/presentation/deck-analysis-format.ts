import { copyCount } from "@/features/analysis/card-copy";
import {
  energyCurve,
  keywordMix,
  speedMix,
  type CurveBucket,
  type KeywordMix,
  type SpeedShare,
} from "@/features/analysis/card-metrics";
import type { ResolvedDeckEntry } from "@/features/deck/deck/resolved-deck";

import { MAIN_DECK_SECTIONS, MAIN_DECK_WITH_LEGEND, deckCards } from "./deck-contents";

interface DeckAnalysis {
  readonly abilityCards: number;
  readonly energyBuckets: readonly CurveBucket[];
  readonly keywords: KeywordMix;
  readonly speeds: readonly SpeedShare[];
}

function deckAnalysis(entries: readonly ResolvedDeckEntry[]): DeckAnalysis {
  const mainDeckCopies = deckCards(entries, MAIN_DECK_SECTIONS);
  const abilityCopies = deckCards(entries, MAIN_DECK_WITH_LEGEND);

  return {
    abilityCards: copyCount(abilityCopies),
    energyBuckets: energyCurve(mainDeckCopies),
    keywords: keywordMix(abilityCopies),
    speeds: speedMix(abilityCopies),
  };
}

export { deckAnalysis };
