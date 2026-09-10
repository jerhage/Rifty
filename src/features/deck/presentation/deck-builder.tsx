import type { CardCounter } from "@/features/catalog/card/card-counter";
import type { Card } from "@/features/catalog/card/card";
import type { CardLister } from "@/features/catalog/card/card-lister";
import type { Keyword } from "@/features/catalog/keyword/keyword";

import {
  useDeckBuild,
  type DeckBuildCapabilities,
  type DeckBuildStart,
} from "./hooks/use-deck-build";
import { DeckBuildScreen } from "./screens/deck-build-screen";

function DeckBuilder({
  capabilities,
  cardCounter,
  cardLister,
  keywords,
  onExit,
  onOpenCard,
  onSaved,
  start,
}: {
  readonly capabilities: DeckBuildCapabilities;
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly keywords: readonly Keyword[];
  readonly onExit: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onSaved: () => void;
  readonly start: DeckBuildStart;
}) {
  const build = useDeckBuild(start, capabilities, { onExit, onSaved });

  return (
    <DeckBuildScreen
      cardCounter={cardCounter}
      cardLister={cardLister}
      draft={build.draft}
      draftPoolFilters={build.draftPoolFilters}
      error={build.error}
      isPoolFilterOpen={build.isPoolFilterOpen}
      isSaving={build.isSaving}
      keywords={keywords}
      legendDomainIds={build.legendDomainIds}
      legendQuery={build.legendQuery}
      legendSearchQuery={build.debouncedLegendQuery}
      onApplyPoolFilters={build.applyPoolFilters}
      onBack={build.back}
      onChangeLegendQuery={build.setLegendQuery}
      onChangeName={build.changeName}
      onChangePoolQuery={build.setPoolQuery}
      onDismissPoolFilters={build.dismissPoolFilters}
      onEditStep={build.goToStep}
      onNext={build.next}
      onOpenCard={onOpenCard}
      onOpenPoolFilters={build.openPoolFilters}
      onPickChampion={build.pickChampion}
      onPickLegend={build.pickLegend}
      onResetPoolFilters={build.resetPoolFilters}
      onSave={() => void build.save()}
      onSelectPoolLayout={build.setPoolLayout}
      onSelectPoolView={build.setPoolView}
      onSelectZone={build.setZone}
      onSetQuantity={build.setQuantity}
      onToggleLegendDomain={build.toggleLegendDomain}
      onTogglePoolDomain={build.togglePoolDomain}
      onTogglePoolKeyword={build.togglePoolKeyword}
      onTogglePoolType={build.togglePoolType}
      mode={build.mode}
      poolFilters={build.poolFilters}
      poolLayout={build.poolLayout}
      poolQuery={build.poolQuery}
      poolSearchQuery={build.debouncedPoolQuery}
      poolView={build.poolView}
      step={build.step}
      stepIndex={build.stepIndex}
      verification={build.verification}
      zone={build.zone}
    />
  );
}

export { DeckBuilder };
