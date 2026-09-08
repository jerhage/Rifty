import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Deck } from "@/features/deck/deck/deck";
import { DecksData } from "@/features/deck/presentation/data/decks-data";
import { DeckListScreen } from "@/features/deck/presentation/screens/deck-list-screen";

function DecksRoute() {
  const { decks } = useAppDependencies();

  return (
    <DecksData deckLister={decks.deckRepository}>
      {({ decks: savedDecks, reload }) => <DeckList decks={savedDecks} onChanged={reload} />}
    </DecksData>
  );
}

function DeckList({
  decks: savedDecks,
  onChanged,
}: {
  readonly decks: readonly Deck[];
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
    <DeckListScreen
      decks={savedDecks}
      now={clock.now()}
      onNewDeck={() => router.push("/decks/build")}
      onOpenDeck={(deckId) => router.push({ pathname: "/decks/[id]", params: { id: deckId } })}
    />
  );
}

export default DecksRoute;
