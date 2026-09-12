import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Card } from "@/features/card/card";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";
import type { ResolvedDeck } from "@/features/deck/deck/resolved-deck";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";
import { DeckDetailScreen } from "@/features/deck/presentation/screens/deck-detail-screen";

function DeckDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cards: cardDependencies, decks } = useAppDependencies();

  return (
    <DeckDetailData
      cardByCardIdFinder={cardDependencies.cardRepository}
      cardsByPrintingIdsFinder={cardDependencies.cardRepository}
      deckFinder={decks.deckRepository}
      deckId={id}
    >
      {({ resolvedDeck }) => <DeckDetail resolvedDeck={resolvedDeck} />}
    </DeckDetailData>
  );
}

function DeckDetail({ resolvedDeck }: { readonly resolvedDeck: ResolvedDeck }) {
  const router = useRouter();
  const { clock } = useAppDependencies();
  const { deck } = resolvedDeck;

  return (
    <>
      <Stack.Screen options={{ title: deck.name }} />
      <DeckDetailScreen
        now={clock.now()}
        onDrawSimulation={() =>
          router.push({ pathname: "/decks/[id]/draw", params: { id: deck.id } })
        }
        onEdit={() => router.push({ pathname: "/decks/build", params: { deckId: deck.id } })}
        onOpenCard={(card: Card) =>
          router.push({ pathname: "/cards/[id]", params: { id: card.printingId } })
        }
        resolvedDeck={resolvedDeck}
        verification={verifyDeck(deck, RIFTBOUND_STANDARD)}
      />
    </>
  );
}

export default DeckDetailRoute;
