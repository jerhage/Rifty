import type { RandomSource } from "@/application/ports/random-source";
import type { Card } from "@/features/card/card";
import type { CardByCardIdFinder } from "@/features/card/card-by-card-id-finder";
import type { CardsByPrintingIdsFinder } from "@/features/card/cards-by-printing-ids-finder";
import type { DeckId } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";

import { DeckDetailData } from "./data/deck-detail-data";
import { DrawSimulationScreen } from "./screens/draw-simulation-screen";

function DrawSimulationPane({
  cardByCardIdFinder,
  cardsByPrintingIdsFinder,
  deckFinder,
  deckId,
  onOpenCard,
  onReturnToDetail,
  randomSource,
}: {
  readonly cardByCardIdFinder: CardByCardIdFinder;
  readonly cardsByPrintingIdsFinder: CardsByPrintingIdsFinder;
  readonly deckFinder: DeckFinder;
  readonly deckId: DeckId;
  readonly onOpenCard: (card: Card) => void;
  readonly onReturnToDetail: () => void;
  readonly randomSource: RandomSource;
}) {
  return (
    <DeckDetailData
      cardByCardIdFinder={cardByCardIdFinder}
      cardsByPrintingIdsFinder={cardsByPrintingIdsFinder}
      deckFinder={deckFinder}
      deckId={deckId}
    >
      {({ resolvedDeck }) => (
        <DrawSimulationScreen
          onBack={onReturnToDetail}
          onKeep={onReturnToDetail}
          onOpenCard={onOpenCard}
          randomSource={randomSource}
          resolvedDeck={resolvedDeck}
        />
      )}
    </DeckDetailData>
  );
}

export { DrawSimulationPane };
