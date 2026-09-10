import { StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedView } from "@/components/ui/atoms/themed-view";
import type { Card } from "@/features/catalog/card/card";
import type { CardCounter } from "@/features/catalog/card/card-counter";
import type { CardLister } from "@/features/catalog/card/card-lister";
import type { Keyword } from "@/features/catalog/keyword/keyword";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { DeckSection, DeckVerification } from "@/features/deck/deck/deck";

import { BuildProgressHeader } from "../components/build/build-progress-header";
import { ChampionStep } from "../components/build/steps/champion-step";
import { LegendStep } from "../components/build/steps/legend-step";
import { PoolFilterSheet } from "../components/build/pool-filter-sheet";
import { ZonesStep } from "../components/build/steps/zones-step";
import { ChampionPoolData } from "../data/champion-pool-data";
import { LegendPoolData } from "../data/legend-pool-data";
import { ZonePoolData } from "../data/zone-pool-data";
import type { DeckBuildDraft, DeckBuildStep } from "../deck-build-steps";
import type { DeckBuildMode } from "../hooks/use-deck-build";
import type { ZonePoolFilters, ZonePoolLayout, ZonePoolView } from "../deck-zone-pool";

interface DeckBuildScreenProps {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly draft: DeckBuildDraft;
  readonly draftPoolFilters: ZonePoolFilters;
  readonly error: string | null;
  readonly isSaving: boolean;
  readonly keywords: readonly Keyword[];
  readonly legendDomainIds: readonly CardDomain[];
  readonly isPoolFilterOpen: boolean;
  /** What the field shows; `legendSearchQuery` is the settled value the query uses. */
  readonly legendQuery: string;
  readonly legendSearchQuery: string;
  readonly mode: DeckBuildMode;
  readonly onApplyPoolFilters: () => void;
  readonly onBack: () => void;
  readonly onChangeLegendQuery: (query: string) => void;
  readonly onChangeName: (name: string) => void;
  readonly onChangePoolQuery: (query: string) => void;
  readonly onDismissPoolFilters: () => void;
  readonly onEditStep: (index: number) => void;
  readonly onNext: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onOpenPoolFilters: () => void;
  readonly onResetPoolFilters: () => void;
  readonly onPickChampion: (card: Card) => void;
  readonly onPickLegend: (card: Card) => void;
  readonly onSave: () => void;
  readonly onSelectPoolLayout: (layout: ZonePoolLayout) => void;
  readonly onSelectPoolView: (view: ZonePoolView) => void;
  readonly onSelectZone: (section: DeckSection) => void;
  readonly onSetQuantity: (section: DeckSection, card: Card, quantity: number) => void;
  readonly onToggleLegendDomain: (domainId: CardDomain) => void;
  readonly onTogglePoolDomain: (domainId: CardDomain) => void;
  readonly onTogglePoolKeyword: (keywordId: string) => void;
  readonly onTogglePoolType: (typeId: CardType) => void;
  readonly poolFilters: ZonePoolFilters;
  readonly poolLayout: ZonePoolLayout;
  readonly poolQuery: string;
  readonly poolSearchQuery: string;
  readonly poolView: ZonePoolView;
  readonly step: DeckBuildStep;
  readonly stepIndex: number;
  readonly verification: DeckVerification;
  readonly zone: DeckSection;
}

/**
 * Each step brings its own pool, so only the step on screen queries the catalog and a slow pool
 * never blocks a step the player is not looking at.
 */
function DeckBuildScreen({
  cardCounter,
  cardLister,
  draft,
  draftPoolFilters,
  error,
  isSaving,
  isPoolFilterOpen,
  keywords,
  legendDomainIds,
  legendQuery,
  legendSearchQuery,
  mode,
  onApplyPoolFilters,
  onBack,
  onChangeLegendQuery,
  onChangeName,
  onChangePoolQuery,
  onDismissPoolFilters,
  onEditStep,
  onNext,
  onOpenCard,
  onOpenPoolFilters,
  onPickChampion,
  onPickLegend,
  onResetPoolFilters,
  onSave,
  onSelectPoolLayout,
  onSelectPoolView,
  onSelectZone,
  onSetQuantity,
  onToggleLegendDomain,
  onTogglePoolDomain,
  onTogglePoolKeyword,
  onTogglePoolType,
  poolFilters,
  poolLayout,
  poolQuery,
  poolSearchQuery,
  poolView,
  step,
  stepIndex,
  verification,
  zone,
}: DeckBuildScreenProps) {
  return (
    <ThemedView style={styles.screen}>
      <BuildProgressHeader mode={mode} onBack={onBack} stepIndex={stepIndex} />
      {match(step.id)
        .with("legend", () => (
          <LegendPoolData
            cardCounter={cardCounter}
            cardLister={cardLister}
            domainIds={legendDomainIds}
            query={legendSearchQuery}
          >
            {(pool) => (
              <LegendStep
                legends={pool.cards}
                onChangeQuery={onChangeLegendQuery}
                onLoadMore={pool.loadMore}
                onNext={onNext}
                onOpenCard={onOpenCard}
                onPick={onPickLegend}
                onToggleDomain={onToggleLegendDomain}
                query={legendQuery}
                selected={draft.legend}
                selectedDomainIds={legendDomainIds}
                step={step}
              />
            )}
          </LegendPoolData>
        ))
        .with("chosenChampion", () => (
          <ChampionPoolData cardCounter={cardCounter} cardLister={cardLister} legend={draft.legend}>
            {(pool) => (
              <ChampionStep
                champions={pool.cards}
                legend={draft.legend}
                onLoadMore={pool.loadMore}
                onNext={onNext}
                onOpenCard={onOpenCard}
                onPick={onPickChampion}
                selected={draft.chosenChampion}
                step={step}
              />
            )}
          </ChampionPoolData>
        ))
        .with("zones", () => (
          <ZonePoolData
            cardCounter={cardCounter}
            cardLister={cardLister}
            filters={poolFilters}
            query={poolSearchQuery}
            zone={zone}
          >
            {(pool) => (
              <>
                <ZonesStep
                  draft={draft}
                  error={error}
                  isSaving={isSaving}
                  onChangeName={onChangeName}
                  onChangePoolQuery={onChangePoolQuery}
                  onEditStep={onEditStep}
                  onLoadMorePool={pool.loadMore}
                  onOpenCard={onOpenCard}
                  onOpenPoolFilters={onOpenPoolFilters}
                  onSave={onSave}
                  onSelectPoolLayout={onSelectPoolLayout}
                  onSelectPoolView={onSelectPoolView}
                  onSelectZone={onSelectZone}
                  onSetQuantity={onSetQuantity}
                  poolFilters={poolFilters}
                  poolLayout={poolLayout}
                  poolQuery={poolQuery}
                  poolView={poolView}
                  verification={verification}
                  zone={zone}
                  zonePool={pool.cards}
                />
                <PoolFilterSheet
                  filters={draftPoolFilters}
                  isPresented={isPoolFilterOpen}
                  keywords={keywords}
                  onApply={onApplyPoolFilters}
                  onDismiss={onDismissPoolFilters}
                  onReset={onResetPoolFilters}
                  onToggleDomain={onTogglePoolDomain}
                  onToggleKeyword={onTogglePoolKeyword}
                  onToggleType={onTogglePoolType}
                  zone={zone}
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
