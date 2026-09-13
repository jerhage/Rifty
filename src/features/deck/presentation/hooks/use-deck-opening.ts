import { useCallback, useState } from "react";

import type { Deck, DeckId } from "@/features/deck/deck/deck";
import { useAnnouncement } from "@/hooks/use-announcement";
import { useDetailOpening } from "@/hooks/use-detail-opening";

type DeckPaneContent =
  | { readonly type: "noDeck" }
  | { readonly type: "detail"; readonly deckId: DeckId }
  | { readonly type: "drawSimulation"; readonly deckId: DeckId };

type DeckOpening =
  | {
      readonly type: "route";
      readonly open: (deck: Deck) => void;
    }
  | {
      readonly type: "pane";
      readonly close: () => void;
      readonly open: (deck: Deck) => void;
      readonly openDrawSimulation: (deckId: DeckId) => void;
      readonly returnToDetail: () => void;
      readonly shown: DeckPaneContent;
    };

function deckIdOf(deck: Deck): DeckId {
  return deck.id;
}

function openedBesideTheList(deck: Deck): string {
  return `${deck.name} opened beside the list.`;
}

/**
 * The simulation belongs to one deck, so it shows only while that deck is the one shown. Picking
 * another deck needs no reset: the simulated id simply stops matching.
 */
function deckPaneContent(shownId: DeckId | null, simulatedId: DeckId | null): DeckPaneContent {
  if (shownId === null) return { type: "noDeck" };
  if (shownId === simulatedId) return { deckId: shownId, type: "drawSimulation" };

  return { deckId: shownId, type: "detail" };
}

/** How a deck picked in the deck list gets shown, in the deck list's own words. */
function useDeckOpening(pushDeckRoute: (deckId: DeckId) => void): DeckOpening {
  const announce = useAnnouncement();
  const [simulatedId, setSimulatedId] = useState<DeckId | null>(null);
  const opening = useDetailOpening({
    closedMessage: "Deck closed.",
    idOf: deckIdOf,
    openedMessage: openedBesideTheList,
    pushRoute: pushDeckRoute,
  });

  const openDrawSimulation = useCallback(
    (deckId: DeckId) => {
      setSimulatedId(deckId);
      announce("Draw simulation opened in place of the deck.", "interrupting");
    },
    [announce],
  );

  const returnToDetail = useCallback(() => {
    setSimulatedId(null);
    announce("Draw simulation closed. The deck is shown again.", "interrupting");
  }, [announce]);

  if (opening.type === "route") return opening;

  return {
    close: () => {
      setSimulatedId(null);
      opening.close();
    },
    open: (deck: Deck) => {
      setSimulatedId(null);
      opening.open(deck);
    },
    openDrawSimulation,
    returnToDetail,
    shown: deckPaneContent(opening.shownId, simulatedId),
    type: "pane",
  };
}

export { useDeckOpening };
export type { DeckOpening, DeckPaneContent };
