import { useMemo } from "react";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Deck } from "@/features/deck/deck/deck";
import { NewDeckSheet } from "@/features/deck/presentation/components/new-deck-sheet";
import { DecksData } from "@/features/deck/presentation/data/decks-data";
import { useNewDeck } from "@/features/deck/presentation/hooks/use-new-deck";
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
  const { clock, decks, idGenerator } = useAppDependencies();
  const capabilities = useMemo(
    () => ({
      clock,
      deckLister: decks.deckRepository,
      deckSaver: decks.deckRepository,
      idGenerator,
    }),
    [clock, decks.deckRepository, idGenerator],
  );
  const newDeck = useNewDeck(capabilities, onChanged);
  // Read the clock once per loaded list so every row's relative label shares one reference point.
  const now = useMemo(() => clock.now(), [clock, savedDecks]);

  return (
    <>
      <DeckListScreen
        decks={savedDecks}
        now={now}
        onNewDeck={newDeck.open}
        onOpenDeck={() => undefined}
      />
      <NewDeckSheet
        error={newDeck.error}
        isPresented={newDeck.isPresented}
        name={newDeck.name}
        onChangeName={newDeck.changeName}
        onDismiss={newDeck.dismiss}
        onSubmit={() => void newDeck.submit()}
      />
    </>
  );
}

export default DecksRoute;
