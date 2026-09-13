import { useCallback, useState } from "react";

import type { CardSummary } from "@/features/card/card-summary";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import { useAnnouncement } from "@/hooks/use-announcement";
import { useLayoutSize } from "@/hooks/use-layout-size";

type CardOpening =
  | {
      readonly type: "route";
      readonly openCard: (card: CardSummary) => void;
    }
  | {
      readonly type: "pane";
      readonly closeCard: () => void;
      readonly openCard: (card: CardSummary) => void;
      readonly shownCardId: PrintingId | null;
    };

const CLOSED_MESSAGE = "Card closed.";

/**
 * How a card picked in the catalog gets shown: pushed as its own route where there is only room
 * for one screen, held beside the grid where there is room for two.
 */
function useCardOpening(pushCardRoute: (cardId: PrintingId) => void): CardOpening {
  const { layoutClass } = useLayoutSize();
  const announce = useAnnouncement();
  const [shownCardId, setShownCardId] = useState<PrintingId | null>(null);

  const pushCard = useCallback(
    (card: CardSummary) => pushCardRoute(card.printingId),
    [pushCardRoute],
  );

  const showCardInPane = useCallback(
    (card: CardSummary) => {
      setShownCardId(card.printingId);
      announce(`${card.name} opened beside the grid.`, "interrupting");
    },
    [announce],
  );

  const closePane = useCallback(() => {
    setShownCardId(null);
    announce(CLOSED_MESSAGE, "interrupting");
  }, [announce]);

  return layoutClass === "tablet"
    ? { closeCard: closePane, openCard: showCardInPane, shownCardId, type: "pane" }
    : { openCard: pushCard, type: "route" };
}

export { useCardOpening };
export type { CardOpening };
