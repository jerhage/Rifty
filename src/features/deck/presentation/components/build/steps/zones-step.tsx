import { ThemedText } from "@/components/ui/atoms/themed-text";
import type { Card } from "@/features/card/card";
import type { DeckSection, DeckVerification } from "@/features/deck/deck/deck";

import type { DeckBuildDraft } from "../../../deck-build-steps";
import type { ZonePoolFilters, ZonePoolLayout, ZonePoolView } from "../../../deck-zone-pool";
import { BuildFooter } from "../build-footer";
import { ZonePoolList } from "../zone-pool-list";
import { ZonesStepHeader } from "./zones-step-header";

interface ZonesStepProps {
  readonly draft: DeckBuildDraft;
  readonly error: string | null;
  readonly isSaving: boolean;
  readonly onChangeName: (name: string) => void;
  readonly onChangePoolQuery: (query: string) => void;
  readonly onEditStep: (index: number) => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onLoadMorePool: () => void;
  readonly onOpenPoolFilters: () => void;
  readonly onSave: () => void;
  readonly onSelectPoolLayout: (layout: ZonePoolLayout) => void;
  readonly onSelectPoolView: (view: ZonePoolView) => void;
  readonly onSelectZone: (section: DeckSection) => void;
  readonly onSetQuantity: (section: DeckSection, card: Card, quantity: number) => void;
  readonly poolFilters: ZonePoolFilters;
  readonly poolLayout: ZonePoolLayout;
  readonly poolQuery: string;
  readonly poolView: ZonePoolView;
  readonly verification: DeckVerification;
  readonly zone: DeckSection;
  readonly zonePool: readonly Card[];
}

function ZonesStep({
  draft,
  error,
  isSaving,
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

      <BuildFooter actionLabel={isSaving ? "Saving…" : "Save deck"} onAction={onSave}>
        {error === null ? (
          <ThemedText numberOfLines={1} themeColor="textSecondary" type="mono">
            {verification.type === "illegal"
              ? `${verification.violations.length} to fix`
              : "Ready to save"}
          </ThemedText>
        ) : (
          <ThemedText numberOfLines={2} themeColor="negative" type="body">
            {error}
          </ThemedText>
        )}
      </BuildFooter>
    </>
  );
}

export { ZonesStep };
export type { ZonesStepProps };
