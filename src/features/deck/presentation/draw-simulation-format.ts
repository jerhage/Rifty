import { match } from "ts-pattern";

import { MULLIGAN_LIMIT } from "@/features/analysis/draw-simulation";

import type { DrawNotice, MulliganState } from "./hooks/use-draw-simulation";

type MulliganAction =
  | { readonly type: "spent"; readonly replaced: number }
  | { readonly type: "awaitingSelection" }
  | { readonly type: "ready"; readonly count: number };

type MulliganStatusMessage =
  | { readonly type: "note"; readonly text: string }
  | { readonly type: "warning"; readonly text: string };

function mulliganAction(mulligan: MulliganState, selectedCount: number): MulliganAction {
  return match<MulliganState, MulliganAction>(mulligan)
    .with({ type: "spent" }, ({ replaced }) => ({ type: "spent", replaced }))
    .with({ type: "available" }, () =>
      selectedCount === 0 ? { type: "awaitingSelection" } : { type: "ready", count: selectedCount },
    )
    .exhaustive();
}

function handLabel(action: MulliganAction, handNumber: number): string {
  return match(action)
    .with(
      { type: "spent" },
      ({ replaced }) => `Opening hand · Hand ${handNumber} · Mulliganed ${replaced}`,
    )
    .with(
      { type: "awaitingSelection" },
      { type: "ready" },
      () => `Opening hand · Hand ${handNumber}`,
    )
    .exhaustive();
}

function mulliganActionLabel(action: MulliganAction): string {
  return match(action)
    .with({ type: "spent" }, () => "Mulligan spent")
    .with({ type: "awaitingSelection" }, () => "Mulligan")
    .with({ type: "ready" }, ({ count }) => `Mulligan ${count}`)
    .exhaustive();
}

function mulliganDisabled(action: MulliganAction): boolean {
  return match(action)
    .with({ type: "spent" }, { type: "awaitingSelection" }, () => true)
    .with({ type: "ready" }, () => false)
    .exhaustive();
}

function mulliganCounterLabel(action: MulliganAction): string {
  return match(action)
    .with({ type: "spent" }, () => "0 left")
    .with({ type: "awaitingSelection" }, () => `${MULLIGAN_LIMIT} of ${MULLIGAN_LIMIT} left`)
    .with({ type: "ready" }, ({ count }) => `${MULLIGAN_LIMIT - count} of ${MULLIGAN_LIMIT} left`)
    .exhaustive();
}

function mulliganNote(action: MulliganAction): string {
  return match(action)
    .with({ type: "spent" }, ({ replaced }) =>
      replaced === 0
        ? "The deck ran out before the redraw. No second mulligan."
        : `You mulliganed ${replaced}. No second mulligan.`,
    )
    .with({ type: "awaitingSelection" }, () => "Tap up to two cards to mulligan")
    .with({ type: "ready" }, ({ count }) => `Redraws ${count}`)
    .exhaustive();
}

function mulliganStatusMessage(action: MulliganAction, notice: DrawNotice): MulliganStatusMessage {
  return match<DrawNotice, MulliganStatusMessage>(notice)
    .with({ type: "selectionLimit" }, () => ({
      type: "warning",
      text: "Two is the mulligan limit. Tap a chosen card again to deselect it.",
    }))
    .with({ type: "mulliganSpent" }, () => ({
      type: "warning",
      text: "One mulligan per game — this hand is set.",
    }))
    .with({ type: "none" }, () => ({ type: "note", text: mulliganNote(action) }))
    .exhaustive();
}

export {
  handLabel,
  mulliganAction,
  mulliganActionLabel,
  mulliganCounterLabel,
  mulliganDisabled,
  mulliganStatusMessage,
};
export type { MulliganAction, MulliganStatusMessage };
