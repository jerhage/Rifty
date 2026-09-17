import type { CardSummary } from "@/features/card/card-summary";
import type { PrintingId } from "@/features/card/value-objects/printing-id";

function savedCards(
  printingIds: ReadonlySet<PrintingId>,
  cards: readonly CardSummary[],
): readonly CardSummary[] {
  const byPrintingId = new Map(cards.map((card) => [card.printingId, card]));

  return [...printingIds].flatMap((printingId) => {
    const card = byPrintingId.get(printingId);

    return card === undefined ? [] : [card];
  });
}

export { savedCards };
