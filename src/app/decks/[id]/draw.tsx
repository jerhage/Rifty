import { useLocalSearchParams, useRouter } from "expo-router";
import { match } from "ts-pattern";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Card } from "@/features/card/card";
import { MissingDeck } from "@/features/deck/presentation/components/missing-deck";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";
import { linkedDeck } from "@/features/deck/presentation/linked-deck";
import { DrawSimulationScreen } from "@/features/deck/presentation/screens/draw-simulation-screen";

function DrawSimulationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { cards: cardDependencies, decks, randomSource } = useAppDependencies();

  return match(linkedDeck(id))
    .with({ type: "unknownDeck" }, () => <MissingDeck />)
    .with({ type: "savedDeck" }, ({ deckId }) => (
      <DeckDetailData
        cardByCardIdFinder={cardDependencies.cardRepository}
        cardsByPrintingIdsFinder={cardDependencies.cardRepository}
        deckFinder={decks.deckRepository}
        deckId={deckId}
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
    ))
    .exhaustive();
}

export default DrawSimulationRoute;
