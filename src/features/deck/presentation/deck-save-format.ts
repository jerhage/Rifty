import { match } from "ts-pattern";

import type { DeckVerification } from "@/features/deck/deck/deck";
import type { SaveDeckResult } from "@/features/deck/deck/use-cases/save-deck";
import type { WriteState } from "@/hooks/use-write-state";

import { saveReadinessLabel } from "./deck-legality-format";

type DeckSaveState = WriteState<SaveDeckResult>;

type SaveRefusal = Exclude<SaveDeckResult, { readonly type: "success" }>;

type SaveFooterMessage =
  | { readonly type: "failure"; readonly message: string }
  | { readonly type: "readiness"; readonly message: string };

const SAVE_FAILED_MESSAGE = "Could not save the deck. Try again.";

function saveActionLabel(state: DeckSaveState): string {
  return match(state)
    .with({ type: "saving" }, () => "Saving…")
    .with(
      { type: "idle" },
      { type: "failed" },
      { type: "success" },
      { type: "nameMissing" },
      { type: "nameTaken" },
      { type: "copyLimitExceeded" },
      () => "Save deck",
    )
    .exhaustive();
}

function refusalMessage(refusal: SaveRefusal): string {
  return match(refusal)
    .with({ type: "nameMissing" }, () => "Give the deck a name.")
    .with({ type: "nameTaken" }, () => "You already have a deck with that name.")
    .with(
      { type: "copyLimitExceeded" },
      ({ violations }) => violations.at(0)?.message ?? "Too many copies of a card.",
    )
    .exhaustive();
}

function footerMessage(state: DeckSaveState, verification: DeckVerification): SaveFooterMessage {
  return match<DeckSaveState, SaveFooterMessage>(state)
    .with({ type: "failed" }, () => ({ type: "failure", message: SAVE_FAILED_MESSAGE }))
    .with(
      { type: "nameMissing" },
      { type: "nameTaken" },
      { type: "copyLimitExceeded" },
      (refusal) => ({ type: "failure", message: refusalMessage(refusal) }),
    )
    .with({ type: "idle" }, { type: "saving" }, { type: "success" }, () => ({
      type: "readiness",
      message: saveReadinessLabel(verification),
    }))
    .exhaustive();
}

export { footerMessage, refusalMessage, SAVE_FAILED_MESSAGE, saveActionLabel };
export type { DeckSaveState, SaveFooterMessage };
