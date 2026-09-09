import { useCallback, useState } from "react";

import type { CardCopy } from "@/features/analysis/card-copy";
import { openingHand } from "@/features/analysis/draw-simulation";
import type { Card } from "@/features/catalog/card/card";

type ShuffleCards = <Item>(items: readonly Item[]) => readonly Item[];

interface DrawSimulation {
  readonly hand: readonly Card[];
  readonly handNumber: number;
  redraw(): void;
}

function useDrawSimulation(
  copies: readonly CardCopy[],
  shuffleCards: ShuffleCards,
): DrawSimulation {
  const [hand, setHand] = useState<readonly Card[]>(() => openingHand(copies, shuffleCards));
  const [handNumber, setHandNumber] = useState(1);

  const redraw = useCallback(() => {
    setHand(openingHand(copies, shuffleCards));
    setHandNumber((count) => count + 1);
  }, [copies, shuffleCards]);

  return { hand, handNumber, redraw };
}

export { useDrawSimulation };
export type { DrawSimulation, ShuffleCards };
