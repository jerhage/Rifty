import type { CardSummary } from "@/features/card/card-summary";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import { useDetailOpening, type DetailOpening } from "@/hooks/use-detail-opening";

type CardOpening = DetailOpening<CardSummary, PrintingId>;

function printingIdOf(card: CardSummary): PrintingId {
  return card.printingId;
}

function openedBesideTheGrid(card: CardSummary): string {
  return `${card.name} opened beside the grid.`;
}

/** How a card picked in the catalog gets shown, in the catalog's own words. */
function useCardOpening(pushCardRoute: (cardId: PrintingId) => void): CardOpening {
  return useDetailOpening({
    closedMessage: "Card closed.",
    idOf: printingIdOf,
    openedMessage: openedBesideTheGrid,
    pushRoute: pushCardRoute,
  });
}

export { useCardOpening };
