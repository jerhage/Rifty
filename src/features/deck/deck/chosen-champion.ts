import type { Card } from "@/features/card/card";

import type { ChosenChampion } from "./deck";

/** Reduces a catalog card to the facts a deck's own rules read about its Chosen Champion. */
function chosenChampionOf(card: Card): ChosenChampion {
  return {
    cardId: card.cardId,
    typeId: card.classification.typeId,
    supertypeId: card.classification.supertypeId,
  };
}

export { chosenChampionOf };
