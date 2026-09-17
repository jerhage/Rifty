import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { match } from "ts-pattern";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Card } from "@/features/card/card";
import { MissingDeck } from "@/features/deck/presentation/components/missing-deck";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";
import { DeckDetail } from "@/features/deck/presentation/deck-detail";
import { linkedDeck } from "@/features/deck/presentation/linked-deck";

function DeckDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cards, clock, decks } = useAppDependencies();
  const router = useRouter();

  return match(linkedDeck(id))
    .with({ type: "unknownDeck" }, () => <MissingDeck />)
    .with({ type: "savedDeck" }, ({ deckId }) => (
      <DeckDetailData
        cardByCardIdFinder={cards.cardRepository}
        cardsByPrintingIdsFinder={cards.cardRepository}
        deckFinder={decks.deckRepository}
        deckId={deckId}
      >
        {({ resolvedDeck }) => (
          <>
            <Stack.Screen options={{ title: resolvedDeck.deck.name }} />
            <DeckDetail
              now={clock.now()}
              onDrawSimulation={() =>
                router.push({ pathname: "/decks/[id]/draw", params: { id: resolvedDeck.deck.id } })
              }
              onEdit={() =>
                router.push({ pathname: "/decks/build", params: { deckId: resolvedDeck.deck.id } })
              }
              onOpenCard={(card: Card) =>
                router.push({ pathname: "/cards/[id]", params: { id: card.printingId } })
              }
              resolvedDeck={resolvedDeck}
            />
          </>
        )}
      </DeckDetailData>
    ))
    .exhaustive();
}

export default DeckDetailRoute;
