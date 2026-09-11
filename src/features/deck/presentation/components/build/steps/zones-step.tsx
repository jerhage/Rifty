import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import type { Card } from "@/features/card/card";

import type { DeckBuildStepId } from "../../../deck-build-steps";
import { saveReadinessLabel } from "../../../deck-legality-format";
import type { ZoneDraftViewState, ZonePoolViewState } from "../../../hooks/use-deck-build";
import type { DeckSaveStatus } from "../../../hooks/use-deck-save";
import { BuildFooter } from "../build-footer";
import { ZonePoolList } from "../zone-pool-list";
import { ZonesStepHeader } from "./zones-step-header";

interface ZonesStepProps {
  readonly draft: ZoneDraftViewState;
  readonly onEditStep: (id: DeckBuildStepId) => void;
  readonly onLoadMorePool: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onSave: () => void;
  readonly pool: ZonePoolViewState;
  readonly saveStatus: DeckSaveStatus;
  readonly zonePool: readonly Card[];
}

function ZonesStep({
  draft,
  onEditStep,
  onLoadMorePool,
  onOpenCard,
  onSave,
  pool,
  saveStatus,
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

      <BuildFooter actionLabel={saveActionLabel(saveStatus)} onAction={onSave}>
        {match(saveStatus)
          .with({ type: "failed" }, ({ message }) => (
            <ThemedText numberOfLines={2} themeColor="negative" type="body">
              {message}
            </ThemedText>
          ))
          .with({ type: "idle" }, { type: "saving" }, () => (
            <ThemedText numberOfLines={1} themeColor="textSecondary" type="mono">
              {saveReadinessLabel(draft.verification)}
            </ThemedText>
          ))
          .exhaustive()}
      </BuildFooter>
    </>
  );
}

function saveActionLabel(status: DeckSaveStatus): string {
  return match(status)
    .with({ type: "saving" }, () => "Saving…")
    .with({ type: "idle" }, { type: "failed" }, () => "Save deck")
    .exhaustive();
}

export { ZonesStep };
export type { ZonesStepProps };
