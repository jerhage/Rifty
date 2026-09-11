import { useLocalSearchParams, useRouter } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Card } from "@/features/card/card";
import type { Deck } from "@/features/deck/deck/deck";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";
import { DeckDetailScreen } from "@/features/deck/presentation/screens/deck-detail-screen";

function DeckDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cards: cardDependencies, decks } = useAppDependencies();

  return (
    <DeckDetailData
      cardCounter={cardDependencies.cardRepository}
      cardLister={cardDependencies.cardRepository}
      deckFinder={decks.deckRepository}
      deckId={id}
    >
      {({ cards, deck }) => <DeckDetail cards={cards} deck={deck} />}
    </DeckDetailData>
  );
}

function DeckDetail({ cards, deck }: { readonly cards: readonly Card[]; readonly deck: Deck }) {
  const router = useRouter();
  const { clock } = useAppDependencies();

  return (
    <DeckDetailScreen
      cards={cards}
      deck={deck}
      now={clock.now()}
      onDrawSimulation={() =>
        router.push({ pathname: "/decks/[id]/draw", params: { id: deck.id } })
      }
      onEdit={() => router.push({ pathname: "/decks/build", params: { deckId: deck.id } })}
      onOpenCard={(card: Card) =>
        router.push({ pathname: "/cards/[id]", params: { id: card.printingId } })
      }
      verification={verifyDeck(deck, RIFTBOUND_STANDARD)}
    />
  );
}

export default DeckDetailRoute;
