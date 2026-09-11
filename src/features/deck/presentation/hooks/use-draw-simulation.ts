import { useCallback, useReducer } from "react";
import { P, match } from "ts-pattern";

import type { CardCopy } from "@/features/analysis/card-copy";
import {
  type DealtHand,
  type MulliganSelection,
  dealHand,
  mulliganHand,
  toggleMulliganSelection,
} from "@/features/analysis/draw-simulation";
import type { Card } from "@/features/card/card";

type ShuffleCards = <Item>(items: readonly Item[]) => readonly Item[];

type MulliganState =
  | { readonly type: "available" }
  | { readonly type: "spent"; readonly replaced: number };

type NoNotice = { readonly type: "none" };
type SelectionLimitNotice = { readonly type: "selectionLimit" };
type MulliganSpentNotice = { readonly type: "mulliganSpent" };

type DrawNotice = NoNotice | SelectionLimitNotice | MulliganSpentNotice;

type DrawSimulationState =
  | {
      readonly type: "choosing";
      readonly dealt: DealtHand;
      readonly handNumber: number;
      readonly selected: readonly number[];
      readonly notice: NoNotice | SelectionLimitNotice;
    }
  | {
      readonly type: "settled";
      readonly dealt: DealtHand;
      readonly handNumber: number;
      readonly replaced: number;
      readonly notice: NoNotice | MulliganSpentNotice;
    };

type DrawSimulationAction =
  | { readonly type: "dealtFreshHand"; readonly dealt: DealtHand }
  | { readonly type: "toggledSelection"; readonly index: number }
  | { readonly type: "tookMulligan" };

interface DrawSimulationDeal {
  readonly copies: readonly CardCopy[];
  readonly shuffleCards: ShuffleCards;
}

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

const NO_SELECTION: readonly number[] = [];

function openingState({ copies, shuffleCards }: DrawSimulationDeal): DrawSimulationState {
  return {
    type: "choosing",
    dealt: dealHand(copies, shuffleCards),
    handNumber: 1,
    selected: NO_SELECTION,
    notice: { type: "none" },
  };
}

function reduceDrawSimulation(
  state: DrawSimulationState,
  action: DrawSimulationAction,
): DrawSimulationState {
  return match<[DrawSimulationState, DrawSimulationAction], DrawSimulationState>([state, action])
    .with([P._, { type: "dealtFreshHand" }], ([current, { dealt }]) => ({
      type: "choosing",
      dealt,
      handNumber: current.handNumber + 1,
      selected: NO_SELECTION,
      notice: { type: "none" },
    }))
    .with([{ type: "settled" }, { type: "toggledSelection" }], ([current]) => ({
      ...current,
      notice: { type: "mulliganSpent" },
    }))
    .with([{ type: "settled" }, { type: "tookMulligan" }], ([current]) => ({
      ...current,
      notice: { type: "mulliganSpent" },
    }))
    .with([{ type: "choosing" }, { type: "toggledSelection" }], ([current, { index }]) =>
      match<MulliganSelection, DrawSimulationState>(
        toggleMulliganSelection(current.selected, index),
      )
        .with({ type: "atLimit" }, () => ({ ...current, notice: { type: "selectionLimit" } }))
        .with({ type: "selected" }, ({ indexes }) => ({
          ...current,
          selected: indexes,
          notice: { type: "none" },
        }))
        .exhaustive(),
    )
    .with([{ type: "choosing" }, { type: "tookMulligan" }], ([current]) => {
      if (current.selected.length === 0) return current;

      const redrawn = mulliganHand(current.dealt, current.selected);

      return {
        type: "settled",
        dealt: { hand: redrawn.hand, pool: current.dealt.pool, cursor: redrawn.cursor },
        handNumber: current.handNumber,
        replaced: redrawn.replaced,
        notice: { type: "none" },
      };
    })
    .exhaustive();
}

function useDrawSimulation(
  copies: readonly CardCopy[],
  shuffleCards: ShuffleCards,
): DrawSimulation {
  const [state, dispatch] = useReducer(
    reduceDrawSimulation,
    { copies, shuffleCards },
    openingState,
  );

  const dealFreshHand = useCallback(() => {
    dispatch({ type: "dealtFreshHand", dealt: dealHand(copies, shuffleCards) });
  }, [copies, shuffleCards]);

  const toggleSelection = useCallback((index: number) => {
    dispatch({ type: "toggledSelection", index });
  }, []);

  const takeMulligan = useCallback(() => {
    dispatch({ type: "tookMulligan" });
  }, []);

  const { mulligan, selected } = match(state)
    .with({ type: "choosing" }, (choosing) => ({
      mulligan: { type: "available" } as const,
      selected: choosing.selected,
    }))
    .with({ type: "settled" }, ({ replaced }) => ({
      mulligan: { type: "spent", replaced } as const,
      selected: NO_SELECTION,
    }))
    .exhaustive();

  return {
    hand: state.dealt.hand,
    handNumber: state.handNumber,
    mulligan,
    notice: state.notice,
    selected,
    dealFreshHand,
    takeMulligan,
    toggleSelection,
  };
}

export { useDrawSimulation };
export type { DrawNotice, DrawSimulation, MulliganState, ShuffleCards };
