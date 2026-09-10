import { StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedView } from "@/components/ui/atoms/themed-view";
import type { Card } from "@/features/card/card";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";
import type { Keyword } from "@/features/card/keyword/keyword";

import { BuildProgressHeader } from "../components/build/build-progress-header";
import { ChampionStep } from "../components/build/steps/champion-step";
import { LegendStep } from "../components/build/steps/legend-step";
import { PoolFilterSheet } from "../components/build/pool-filter-sheet";
import { ZonesStep } from "../components/build/steps/zones-step";
import { ChampionPoolData } from "../data/champion-pool-data";
import { LegendPoolData } from "../data/legend-pool-data";
import { ZonePoolData } from "../data/zone-pool-data";
import type {
  DeckBuildStepsState,
  DeckDraftState,
  DeckSaveState,
  LegendSearchState,
  ZonePoolState,
} from "../hooks/use-deck-build";

interface DeckBuildScreenProps {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly draft: DeckDraftState;
  readonly keywords: readonly Keyword[];
  readonly legends: LegendSearchState;
  readonly onOpenCard: (card: Card) => void;
  readonly pool: ZonePoolState;
  readonly saving: DeckSaveState;
  readonly steps: DeckBuildStepsState;
}

/**
 * Each step brings its own pool, so only the step on screen queries the catalog and a slow pool
 * never blocks a step the player is not looking at.
 */
function DeckBuildScreen({
  cardCounter,
  cardLister,
  draft,
  keywords,
  legends,
  onOpenCard,
  pool,
  saving,
  steps,
}: DeckBuildScreenProps) {
  return (
    <ThemedView style={styles.screen}>
      <BuildProgressHeader mode={steps.mode} onBack={steps.back} stepIndex={steps.stepIndex} />
      {match(steps.step.id)
        .with("legend", () => (
          <LegendPoolData
            cardCounter={cardCounter}
            cardLister={cardLister}
            domainIds={legends.domainIds}
            query={legends.searchQuery}
          >
            {(legendPool) => (
              <LegendStep
                legends={legendPool.cards}
                onChangeQuery={legends.setQuery}
                onLoadMore={legendPool.loadMore}
                onNext={steps.next}
                onOpenCard={onOpenCard}
                onPick={draft.pickLegend}
                onToggleDomain={legends.toggleDomain}
                query={legends.query}
                selected={draft.draft.legend}
                selectedDomainIds={legends.domainIds}
                step={steps.step}
              />
            )}
          </LegendPoolData>
        ))
        .with("chosenChampion", () => (
          <ChampionPoolData
            cardCounter={cardCounter}
            cardLister={cardLister}
            legend={draft.draft.legend}
          >
            {(championPool) => (
              <ChampionStep
                champions={championPool.cards}
                legend={draft.draft.legend}
                onLoadMore={championPool.loadMore}
                onNext={steps.next}
                onOpenCard={onOpenCard}
                onPick={draft.pickChampion}
                selected={draft.draft.chosenChampion}
                step={steps.step}
              />
            )}
          </ChampionPoolData>
        ))
        .with("zones", () => (
          <ZonePoolData
            cardCounter={cardCounter}
            cardLister={cardLister}
            filters={pool.filters}
            query={pool.searchQuery}
            zone={pool.zone}
          >
            {(zonePool) => (
              <>
                <ZonesStep
                  draft={draft.draft}
                  error={saving.error}
                  isSaving={saving.isSaving}
                  onChangeName={draft.changeName}
                  onChangePoolQuery={pool.setQuery}
                  onEditStep={steps.goToStep}
                  onLoadMorePool={zonePool.loadMore}
                  onOpenCard={onOpenCard}
                  onOpenPoolFilters={pool.openFilters}
                  onSave={() => void saving.save()}
                  onSelectPoolLayout={pool.setLayout}
                  onSelectPoolView={pool.setView}
                  onSelectZone={pool.setZone}
                  onSetQuantity={draft.setQuantity}
                  poolFilters={pool.filters}
                  poolLayout={pool.layout}
                  poolQuery={pool.query}
                  poolView={pool.view}
                  verification={draft.verification}
                  zone={pool.zone}
                  zonePool={zonePool.cards}
                />
                <PoolFilterSheet
                  filters={pool.draftFilters}
                  isPresented={pool.isFilterOpen}
                  keywords={keywords}
                  onApply={pool.applyFilters}
                  onDismiss={pool.dismissFilters}
                  onReset={pool.resetFilters}
                  onToggleDomain={pool.toggleDomain}
                  onToggleKeyword={pool.toggleKeyword}
                  onToggleType={pool.toggleType}
                  zone={pool.zone}
                />
              </>
            )}
          </ZonePoolData>
        ))
        .exhaustive()}
    </ThemedView>
  );
}

export { DeckBuildScreen };
export type { DeckBuildScreenProps };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
