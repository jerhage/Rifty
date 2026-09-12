import { useLocalSearchParams, useRouter } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Card } from "@/features/card/card";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";
import { DrawSimulationScreen } from "@/features/deck/presentation/screens/draw-simulation-screen";

function DrawSimulationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { cards: cardDependencies, decks, randomSource } = useAppDependencies();

  return (
    <DeckDetailData
      cardByCardIdFinder={cardDependencies.cardRepository}
      cardsByPrintingIdsFinder={cardDependencies.cardRepository}
      deckFinder={decks.deckRepository}
      deckId={id}
    >
      {({ resolvedDeck }) => (
        <DrawSimulationScreen
          onBack={() => router.back()}
          onKeep={() => router.back()}
          onOpenCard={(card: Card) =>
            router.push({ pathname: "/cards/[id]", params: { id: card.printingId } })
          }
          randomSource={randomSource}
          resolvedDeck={resolvedDeck}
        />
      )}
    </DeckDetailData>
  );
}

export default DrawSimulationRoute;
