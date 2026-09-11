import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import type { Card } from "@/features/card/card";
import type { DeckVerification } from "@/features/deck/deck/deck";
import type { SaveDeckResult } from "@/features/deck/deck/use-cases/save-deck";
import type { WriteState } from "@/hooks/use-write-state";

import type { DeckBuildStepId } from "../../../deck-build-steps";
import { saveReadinessLabel } from "../../../deck-legality-format";
import type { ZoneDraftViewState, ZonePoolViewState } from "../../../hooks/use-deck-build";
import { BuildFooter } from "../build-footer";
import { ZonePoolList } from "../zone-pool-list";
import { ZonesStepHeader } from "./zones-step-header";

type DeckSaveState = WriteState<SaveDeckResult>;

type SaveFooterMessage =
  | { readonly type: "failure"; readonly message: string }
  | { readonly type: "readiness"; readonly message: string };

interface ZonesStepProps {
  readonly draft: ZoneDraftViewState;
  readonly onEditStep: (id: DeckBuildStepId) => void;
  readonly onLoadMorePool: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onSave: () => void;
  readonly pool: ZonePoolViewState;
  readonly saveState: DeckSaveState;
  readonly zonePool: readonly Card[];
}

function ZonesStep({
  draft,
  onEditStep,
  onLoadMorePool,
  onOpenCard,
  onSave,
  pool,
  saveState,
  zonePool,
}: ZonesStepProps) {
  return (
    <>
      <ZonesStepHeader draft={draft} onEditStep={onEditStep} pool={pool} />

      <ZonePoolList
        draft={draft.draft}
        onLoadMorePool={onLoadMorePool}
        onOpenCard={onOpenCard}
        onSetQuantity={draft.setQuantity}
        poolLayout={pool.layout}
        poolView={pool.view}
        zone={pool.zone}
        zonePool={zonePool}
      />

      <BuildFooter actionLabel={saveActionLabel(saveState)} onAction={onSave}>
        {match(footerMessage(saveState, draft.verification))
          .with({ type: "failure" }, ({ message }) => (
            <ThemedText numberOfLines={2} themeColor="negative" type="body">
              {message}
            </ThemedText>
          ))
          .with({ type: "readiness" }, ({ message }) => (
            <ThemedText numberOfLines={1} themeColor="textSecondary" type="mono">
              {message}
            </ThemedText>
          ))
          .exhaustive()}
      </BuildFooter>
    </>
  );
}

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

function footerMessage(state: DeckSaveState, verification: DeckVerification): SaveFooterMessage {
  return match<DeckSaveState, SaveFooterMessage>(state)
    .with({ type: "failed" }, () => ({
      type: "failure",
      message: "Could not save the deck. Try again.",
    }))
    .with({ type: "nameMissing" }, () => ({
      type: "failure",
      message: "Give the deck a name.",
    }))
    .with({ type: "nameTaken" }, () => ({
      type: "failure",
      message: "You already have a deck with that name.",
    }))
    .with({ type: "copyLimitExceeded" }, ({ violations }) => ({
      type: "failure",
      message: violations[0]?.message ?? "Too many copies of a card.",
    }))
    .with({ type: "idle" }, { type: "saving" }, { type: "success" }, () => ({
      type: "readiness",
      message: saveReadinessLabel(verification),
    }))
    .exhaustive();
}

export { ZonesStep };
export type { ZonesStepProps };
