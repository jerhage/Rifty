import { useRouter } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { Deck } from "@/features/deck/deck/deck";
import { DecksData } from "@/features/deck/presentation/data/decks-data";
import { DeckListScreen } from "@/features/deck/presentation/screens/deck-list-screen";

function DecksRoute() {
  const { decks } = useAppDependencies();

  return (
    <DecksData deckLister={decks.deckRepository}>
      {({ decks: savedDecks }) => <DeckList decks={savedDecks} />}
    </DecksData>
  );
}

function DeckList({ decks: savedDecks }: { readonly decks: readonly Deck[] }) {
  const router = useRouter();
  const { clock } = useAppDependencies();

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
