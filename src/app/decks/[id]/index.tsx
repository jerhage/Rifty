import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";

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
      cardLister={cardDependencies.cardRepository}
      deckFinder={decks.deckRepository}
      deckId={id}
    >
      {({ cards, deck, reload }) => <DeckDetail cards={cards} deck={deck} onChanged={reload} />}
    </DeckDetailData>
  );
}

function DeckDetail({
  cards,
  deck,
  onChanged,
}: {
  readonly cards: readonly Card[];
  readonly deck: Deck;
  readonly onChanged: () => void;
}) {
  const router = useRouter();
  const { clock } = useAppDependencies();

  useFocusEffect(
    useCallback(() => {
      onChanged();
    }, [onChanged]),
  );

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
