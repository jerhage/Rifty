import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import type { Card } from "@/features/card/card";
import type { DeckVerification } from "@/features/deck/deck/deck";
import type { ZoneSection } from "@/features/deck/deck/deck-legality";

import type { DeckBuildDraft, DeckBuildStepId } from "../../../deck-build-steps";
import { saveReadinessLabel } from "../../../deck-legality-format";
import type { ZonePoolFilters, ZonePoolLayout, ZonePoolView } from "../../../deck-zone-pool";
import type { DeckSaveStatus } from "../../../hooks/use-deck-save";
import { BuildFooter } from "../build-footer";
import { ZonePoolList } from "../zone-pool-list";
import { ZonesStepHeader } from "./zones-step-header";

interface ZonesStepProps {
  readonly draft: DeckBuildDraft;
  readonly onChangeName: (name: string) => void;
  readonly onChangePoolQuery: (query: string) => void;
  readonly onEditStep: (id: DeckBuildStepId) => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onLoadMorePool: () => void;
  readonly onOpenPoolFilters: () => void;
  readonly onSave: () => void;
  readonly onSelectPoolLayout: (layout: ZonePoolLayout) => void;
  readonly onSelectPoolView: (view: ZonePoolView) => void;
  readonly onSelectZone: (section: ZoneSection) => void;
  readonly onSetQuantity: (section: ZoneSection, card: Card, quantity: number) => void;
  readonly poolFilters: ZonePoolFilters;
  readonly poolLayout: ZonePoolLayout;
  readonly poolQuery: string;
  readonly poolView: ZonePoolView;
  readonly saveStatus: DeckSaveStatus;
  readonly verification: DeckVerification;
  readonly zone: ZoneSection;
  readonly zonePool: readonly Card[];
}

function ZonesStep({
  draft,
  onChangeName,
  onChangePoolQuery,
  onEditStep,
  onLoadMorePool,
  onOpenCard,
  onSave,
  onOpenPoolFilters,
  onSelectPoolLayout,
  onSelectPoolView,
  onSelectZone,
  onSetQuantity,
  poolFilters,
  poolLayout,
  poolQuery,
  poolView,
  saveStatus,
  verification,
  zone,
  zonePool,
}: ZonesStepProps) {
  return (
    <>
      <ZonesStepHeader
        draft={draft}
        onChangeName={onChangeName}
        onChangePoolQuery={onChangePoolQuery}
        onEditStep={onEditStep}
        onOpenPoolFilters={onOpenPoolFilters}
        onSelectPoolLayout={onSelectPoolLayout}
        onSelectPoolView={onSelectPoolView}
        onSelectZone={onSelectZone}
        poolFilters={poolFilters}
        poolLayout={poolLayout}
        poolQuery={poolQuery}
        poolView={poolView}
        verification={verification}
        zone={zone}
      />

      <ZonePoolList
        draft={draft}
        onLoadMorePool={onLoadMorePool}
        onOpenCard={onOpenCard}
        onSetQuantity={onSetQuantity}
        poolLayout={poolLayout}
        poolView={poolView}
        zone={zone}
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
              {saveReadinessLabel(verification)}
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
