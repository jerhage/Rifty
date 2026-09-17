import { useCallback, useState } from "react";
import { match } from "ts-pattern";

import type { Deck, DeckId } from "@/features/deck/deck/deck";
import { useAnnouncement } from "@/hooks/use-announcement";
import { useDetailOpening, type DetailPaneContent } from "@/hooks/use-detail-opening";

type DeckPaneContent =
  | { readonly type: "noDeck" }
  | { readonly type: "detail"; readonly deckId: DeckId }
  | { readonly type: "drawSimulation"; readonly deckId: DeckId };

type SimulatedDeck =
  | { readonly type: "noSimulation" }
  | { readonly type: "simulating"; readonly deckId: DeckId };

const NO_SIMULATION: SimulatedDeck = { type: "noSimulation" };

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
 * another deck needs no reset: the simulated deck simply stops being the shown one.
 */
function deckPaneContent(
  shown: DetailPaneContent<DeckId>,
  simulated: SimulatedDeck,
): DeckPaneContent {
  return match({ shown, simulated })
    .returnType<DeckPaneContent>()
    .with({ shown: { type: "noSubject" } }, () => ({ type: "noDeck" }))
    .with(
      { shown: { type: "subject" }, simulated: { type: "simulating" } },
      ({ shown: subject, simulated: simulation }) => subject.id === simulation.deckId,
      ({ shown: subject }) => ({ deckId: subject.id, type: "drawSimulation" }),
    )
    .with({ shown: { type: "subject" } }, ({ shown: subject }) => ({
      deckId: subject.id,
      type: "detail",
    }))
    .exhaustive();
}

/** How a deck picked in the deck list gets shown, in the deck list's own words. */
function useDeckOpening(pushDeckRoute: (deckId: DeckId) => void): DeckOpening {
  const announce = useAnnouncement();
  const [simulated, setSimulated] = useState<SimulatedDeck>(NO_SIMULATION);
  const opening = useDetailOpening({
    closedMessage: "Deck closed.",
    idOf: deckIdOf,
    openedMessage: openedBesideTheList,
    pushRoute: pushDeckRoute,
  });

  const openDrawSimulation = useCallback(
    (deckId: DeckId) => {
      setSimulated({ deckId, type: "simulating" });
      announce("Draw simulation opened in place of the deck.", "interrupting");
    },
    [announce],
  );

  const returnToDetail = useCallback(() => {
    setSimulated(NO_SIMULATION);
    announce("Draw simulation closed. The deck is shown again.", "interrupting");
  }, [announce]);

  if (opening.type === "route") return opening;

  return {
    close: () => {
      setSimulated(NO_SIMULATION);
      opening.close();
    },
    open: (deck: Deck) => {
      setSimulated(NO_SIMULATION);
      opening.open(deck);
    },
    openDrawSimulation,
    returnToDetail,
    shown: deckPaneContent(opening.shown, simulated),
    type: "pane",
  };
}

export { useDeckOpening };
export type { DeckOpening, DeckPaneContent };
