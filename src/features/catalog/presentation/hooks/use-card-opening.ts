import type { CardSummary } from "@/features/card/card-summary";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import { useDetailOpening, type DetailOpening } from "@/hooks/use-detail-opening";

function printingIdOf(card: CardSummary): PrintingId {
  return card.printingId;
}

function openedBesideTheGrid(card: CardSummary): string {
  return `${card.name} opened beside the grid.`;
}

/** How a card picked in the catalog gets shown, in the catalog's own words. */
function useCardOpening(
  pushCardRoute: (printingId: PrintingId) => void,
): DetailOpening<CardSummary, PrintingId> {
  return useDetailOpening({
    closedMessage: "Card closed.",
    idOf: printingIdOf,
    openedMessage: openedBesideTheGrid,
    pushRoute: pushCardRoute,
  });
}

export { useCardOpening };
