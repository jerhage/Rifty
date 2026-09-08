import type { CardCounter } from "@/features/catalog/card/card-counter";
import type { Card } from "@/features/catalog/card/card";
import type { CardLister } from "@/features/catalog/card/card-lister";

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
  onOpenCard,
  onSaved,
  start,
}: {
  readonly capabilities: DeckBuildCapabilities;
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly onOpenCard: (card: Card) => void;
  readonly onSaved: () => void;
  readonly start: DeckBuildStart;
}) {
  const build = useDeckBuild(start, capabilities, onSaved);

  return (
    <DeckBuildScreen
      cardCounter={cardCounter}
      cardLister={cardLister}
      draft={build.draft}
      error={build.error}
      isPoolFilterOpen={build.isPoolFilterOpen}
      isSaving={build.isSaving}
      legendDomainIds={build.legendDomainIds}
      legendQuery={build.legendQuery}
      legendSearchQuery={build.debouncedLegendQuery}
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
      onTogglePoolType={build.togglePoolType}
      poolFilters={build.poolFilters}
      poolLayout={build.poolLayout}
      poolSearchFilters={build.poolQueryFilters}
      poolView={build.poolView}
      step={build.step}
      stepIndex={build.stepIndex}
      verification={build.verification}
      zone={build.zone}
    />
  );
}

export { DeckBuilder };
