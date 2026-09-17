import { match } from "ts-pattern";

import type { CardSummary } from "@/features/card/card-summary";
import type { CardPaneContent } from "@/features/card/presentation/card-pane-content";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import { useDetailOpening } from "@/hooks/use-detail-opening";

type CardOpening =
  | {
      readonly type: "route";
      readonly open: (card: CardSummary) => void;
    }
  | {
      readonly type: "pane";
      readonly close: () => void;
      readonly open: (card: CardSummary) => void;
      readonly shown: CardPaneContent;
    };

function printingIdOf(card: CardSummary): PrintingId {
  return card.printingId;
}

function openedBesideTheGrid(card: CardSummary): string {
  return `${card.name} opened beside the grid.`;
}

function cardPaneContent(shownId: PrintingId | null): CardPaneContent {
  if (shownId === null) return { type: "noCard" };

  return { printingId: shownId, type: "card" };
}

/** How a card picked in the catalog gets shown, in the catalog's own words. */
function useCardOpening(pushCardRoute: (printingId: PrintingId) => void): CardOpening {
  const opening = useDetailOpening({
    closedMessage: "Card closed.",
    idOf: printingIdOf,
    openedMessage: openedBesideTheGrid,
    pushRoute: pushCardRoute,
  });

  return match(opening)
    .returnType<CardOpening>()
    .with({ type: "route" }, (route) => route)
    .with({ type: "pane" }, ({ close, open, shownId }) => ({
      close,
      open,
      shown: cardPaneContent(shownId),
      type: "pane",
    }))
    .exhaustive();
}

export { useCardOpening };
