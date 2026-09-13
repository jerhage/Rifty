import { useRouter } from "expo-router";
import { useCallback } from "react";
import { match } from "ts-pattern";

import { SplitLayout } from "@/components/app-shell/split-layout";
import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Card } from "@/features/card/card";
import type { Deck, DeckId } from "@/features/deck/deck/deck";
import { DecksData } from "@/features/deck/presentation/data/decks-data";
import { DeckPrimaryPane } from "@/features/deck/presentation/deck-primary-pane";
import { useDeckOpening } from "@/features/deck/presentation/hooks/use-deck-opening";
import { DeckListScreen } from "@/features/deck/presentation/screens/deck-list-screen";

function DecksRoute() {
  const { cards, clock, decks, randomSource } = useAppDependencies();
  const router = useRouter();
  const pushDeckRoute = useCallback(
    (deckId: DeckId) => router.push({ pathname: "/decks/[id]", params: { id: deckId } }),
    [router],
  );
  const pushDeckBuildRoute = useCallback(
    (deckId: DeckId) => router.push({ pathname: "/decks/build", params: { deckId } }),
    [router],
  );
  const pushCardRoute = useCallback(
    (card: Card) => router.push({ pathname: "/cards/[id]", params: { id: card.printingId } }),
    [router],
  );
  const opening = useDeckOpening(pushDeckRoute);

  return match(opening)
    .with({ type: "route" }, ({ open }) => <DeckList onOpenDeck={open} />)
    .with({ type: "pane" }, ({ close, open, openDrawSimulation, returnToDetail, shown }) => (
      <SplitLayout
        primary={
          <DeckPrimaryPane
            cardByCardIdFinder={cards.cardRepository}
            cardsByPrintingIdsFinder={cards.cardRepository}
            deckFinder={decks.deckRepository}
            now={clock.now()}
            onClose={close}
            onEdit={pushDeckBuildRoute}
            onOpenCard={pushCardRoute}
            onOpenDrawSimulation={openDrawSimulation}
            onReturnToDetail={returnToDetail}
            randomSource={randomSource}
            shown={shown}
          />
        }
        secondary={<DeckList onOpenDeck={open} />}
      />
    ))
    .exhaustive();
}

function DeckList({ onOpenDeck }: { readonly onOpenDeck: (deck: Deck) => void }) {
  const { clock, decks } = useAppDependencies();
  const router = useRouter();

  return (
    <DecksData deckLister={decks.deckRepository}>
      {({ decks: savedDecks }) => (
        <DeckListScreen
          decks={savedDecks}
          now={clock.now()}
          onNewDeck={() => router.push("/decks/build")}
          onOpenDeck={onOpenDeck}
        />
      )}
    </DecksData>
  );
}

export default DecksRoute;
