import { useLocalSearchParams, useRouter } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
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
          randomSource={randomSource}
        />
      )}
    </DeckDetailData>
  );
}

export default DrawSimulationRoute;
