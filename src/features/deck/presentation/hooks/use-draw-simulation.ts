import { useCallback, useState } from "react";
import { match } from "ts-pattern";

import type { CardCopy } from "@/features/analysis/card-copy";
import {
  type DealtHand,
  dealHand,
  mulliganHand,
  toggleMulliganSelection,
} from "@/features/analysis/draw-simulation";
import type { Card } from "@/features/card/card";

type ShuffleCards = <Item>(items: readonly Item[]) => readonly Item[];

type MulliganState =
  | { readonly type: "available" }
  | { readonly type: "spent"; readonly replaced: number };

type DrawNotice =
  | { readonly type: "none" }
  | { readonly type: "selectionLimit" }
  | { readonly type: "mulliganSpent" };

interface DrawSimulation {
  readonly hand: readonly Card[];
  readonly handNumber: number;
  readonly mulligan: MulliganState;
  readonly notice: DrawNotice;
  readonly selected: readonly number[];
  dealFreshHand(): void;
  takeMulligan(): void;
  toggleSelection(index: number): void;
}

function useDrawSimulation(
  copies: readonly CardCopy[],
  shuffleCards: ShuffleCards,
): DrawSimulation {
  const [dealt, setDealt] = useState<DealtHand>(() => dealHand(copies, shuffleCards));
  const [handNumber, setHandNumber] = useState(1);
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [mulligan, setMulligan] = useState<MulliganState>({ type: "available" });
  const [notice, setNotice] = useState<DrawNotice>({ type: "none" });

  const dealFreshHand = useCallback(() => {
    setDealt(dealHand(copies, shuffleCards));
    setHandNumber((count) => count + 1);
    setSelected([]);
    setMulligan({ type: "available" });
    setNotice({ type: "none" });
  }, [copies, shuffleCards]);

  const toggleSelection = useCallback(
    (index: number) => {
      match(mulligan)
        .with({ type: "spent" }, () => {
          setNotice({ type: "mulliganSpent" });
        })
        .with({ type: "available" }, () => {
          match(toggleMulliganSelection(selected, index))
            .with({ type: "atLimit" }, () => {
              setNotice({ type: "selectionLimit" });
            })
            .with({ type: "selected" }, (choice) => {
              setSelected(choice.indexes);
              setNotice({ type: "none" });
            })
            .exhaustive();
        })
        .exhaustive();
    },
    [mulligan, selected],
  );

  const takeMulligan = useCallback(() => {
    match(mulligan)
      .with({ type: "spent" }, () => {
        setNotice({ type: "mulliganSpent" });
      })
      .with({ type: "available" }, () => {
        if (selected.length === 0) return;

        const redrawn = mulliganHand(dealt, selected);

        setDealt({ hand: redrawn.hand, pool: dealt.pool, cursor: redrawn.cursor });
        setSelected([]);
        setMulligan({ type: "spent", replaced: redrawn.replaced });
        setNotice({ type: "none" });
      })
      .exhaustive();
  }, [dealt, mulligan, selected]);

  return {
    hand: dealt.hand,
    handNumber,
    mulligan,
    notice,
    selected,
    dealFreshHand,
    takeMulligan,
    toggleSelection,
  };
}

export { useDrawSimulation };
export type { DrawNotice, DrawSimulation, MulliganState, ShuffleCards };
