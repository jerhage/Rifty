import type { Deck, DeckId } from "@/features/deck/deck/deck";
import { useDetailOpening, type DetailOpening } from "@/hooks/use-detail-opening";

type DeckOpening = DetailOpening<Deck, DeckId>;

function deckIdOf(deck: Deck): DeckId {
  return deck.id;
}

function openedBesideTheList(deck: Deck): string {
  return `${deck.name} opened beside the list.`;
}

/** How a deck picked in the deck list gets shown, in the deck list's own words. */
function useDeckOpening(pushDeckRoute: (deckId: DeckId) => void): DeckOpening {
  return useDetailOpening({
    closedMessage: "Deck closed.",
    idOf: deckIdOf,
    openedMessage: openedBesideTheList,
    pushRoute: pushDeckRoute,
  });
}

export { useDeckOpening };
