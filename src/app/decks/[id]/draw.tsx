import { useLocalSearchParams, useRouter } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Card } from "@/features/catalog/card/card";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";
import { DrawSimulationScreen } from "@/features/deck/presentation/screens/draw-simulation-screen";

function DrawSimulationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { catalog, decks, randomSource } = useAppDependencies();

  return (
    <DeckDetailData
      cardLister={catalog.cardRepository}
      deckFinder={decks.deckRepository}
      deckId={id}
    >
      {({ cards, deck }) => (
        <DrawSimulationScreen
          cards={cards}
          deck={deck}
          onBack={() => router.back()}
          onKeep={() => router.back()}
          onOpenCard={(card: Card) =>
            router.push({ pathname: "/cards/[id]", params: { id: card.id } })
          }
          randomSource={randomSource}
        />
      )}
    </DeckDetailData>
  );
}

export default DrawSimulationRoute;
