import { useLocalSearchParams, useRouter } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";
import { DeckDetailData } from "@/features/deck/presentation/data/deck-detail-data";
import { DeckDetailScreen } from "@/features/deck/presentation/screens/deck-detail-screen";

function DeckDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { catalog, clock, decks } = useAppDependencies();

  return (
    <DeckDetailData
      cardLister={catalog.cardRepository}
      deckFinder={decks.deckRepository}
      deckId={id}
    >
      {({ cards, deck }) => (
        <DeckDetailScreen
          cards={cards}
          deck={deck}
          now={clock.now()}
          onOpenCard={(card) => router.push({ pathname: "/cards/[id]", params: { id: card.id } })}
          verification={verifyDeck(deck, RIFTBOUND_STANDARD)}
        />
      )}
    </DeckDetailData>
  );
}

export default DeckDetailRoute;
