import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Card } from "@/features/card/card";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";
import { DeckDetail } from "@/features/deck/presentation/deck-detail";

function DeckDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cards, clock, decks } = useAppDependencies();
  const router = useRouter();

  return (
    <DeckDetailData
      cardByCardIdFinder={cards.cardRepository}
      cardsByPrintingIdsFinder={cards.cardRepository}
      deckFinder={decks.deckRepository}
      deckId={id}
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
  );
}

export default DeckDetailRoute;
