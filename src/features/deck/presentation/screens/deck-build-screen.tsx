import { StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedView } from "@/components/ui/atoms/themed-view";
import type { Card } from "@/features/catalog/card/card";
import type { CardDomain } from "@/features/catalog/value-objects/card-domain";
import type { DeckSection, DeckVerification } from "@/features/deck/deck/deck";

import { BuildProgressHeader } from "../components/build/build-progress-header";
import { ChampionStep } from "../components/build/steps/champion-step";
import { LegendStep } from "../components/build/steps/legend-step";
import { ZonesStep } from "../components/build/steps/zones-step";
import type { DeckBuildDraft, DeckBuildStep } from "../deck-build-steps";
import type { ZonePoolFilters } from "../deck-zone-pool";

interface DeckBuildScreenProps {
  readonly champions: readonly Card[];
  readonly draft: DeckBuildDraft;
  readonly error: string | null;
  readonly isSaving: boolean;
  readonly legendDomainIds: readonly CardDomain[];
  readonly legendQuery: string;
  readonly legends: readonly Card[];
  readonly onBack: () => void;
  readonly onChangeName: (name: string) => void;
  readonly onChangeLegendQuery: (query: string) => void;
  readonly onChangePoolQuery: (query: string) => void;
  readonly onEditStep: (index: number) => void;
  readonly onLoadMoreChampions: () => void;
  readonly onLoadMoreLegends: () => void;
  readonly onLoadMorePool: () => void;
  readonly onNext: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onPickChampion: (card: Card) => void;
  readonly onPickLegend: (card: Card) => void;
  readonly onSave: () => void;
  readonly onSelectZone: (section: DeckSection) => void;
  readonly onOpenPoolFilters: () => void;
  readonly onSetQuantity: (section: DeckSection, card: Card, quantity: number) => void;
  readonly onToggleLegendDomain: (domainId: CardDomain) => void;
  readonly poolFilters: ZonePoolFilters;
  readonly step: DeckBuildStep;
  readonly stepIndex: number;
  readonly verification: DeckVerification;
  readonly zone: DeckSection;
  readonly zonePool: readonly Card[];
}

function DeckBuildScreen({
  champions,
  draft,
  error,
  isSaving,
  legendDomainIds,
  legendQuery,
  legends,
  onBack,
  onChangeName,
  onChangeLegendQuery,
  onChangePoolQuery,
  onEditStep,
  onLoadMoreChampions,
  onLoadMoreLegends,
  onLoadMorePool,
  onNext,
  onOpenCard,
  onPickChampion,
  onPickLegend,
  onSave,
  onSelectZone,
  onOpenPoolFilters,
  onSetQuantity,
  onToggleLegendDomain,
  poolFilters,
  step,
  stepIndex,
  verification,
  zone,
  zonePool,
}: DeckBuildScreenProps) {
  return (
    <ThemedView style={styles.screen}>
      <BuildProgressHeader onBack={onBack} stepIndex={stepIndex} />
      {match(step.id)
        .with("legend", () => (
          <LegendStep
            legends={legends}
            onChangeQuery={onChangeLegendQuery}
            onLoadMore={onLoadMoreLegends}
            onNext={onNext}
            onOpenCard={onOpenCard}
            onPick={onPickLegend}
            onToggleDomain={onToggleLegendDomain}
            query={legendQuery}
            selectedDomainIds={legendDomainIds}
            selected={draft.legend}
            step={step}
          />
        ))
        .with("chosenChampion", () => (
          <ChampionStep
            champions={champions}
            legend={draft.legend}
            onLoadMore={onLoadMoreChampions}
            onNext={onNext}
            onOpenCard={onOpenCard}
            onPick={onPickChampion}
            selected={draft.chosenChampion}
            step={step}
          />
        ))
        .with("zones", () => (
          <ZonesStep
            draft={draft}
            error={error}
            isSaving={isSaving}
            onChangeName={onChangeName}
            onChangePoolQuery={onChangePoolQuery}
            onEditStep={onEditStep}
            onLoadMorePool={onLoadMorePool}
            onOpenCard={onOpenCard}
            onSave={onSave}
            onSelectZone={onSelectZone}
            onOpenPoolFilters={onOpenPoolFilters}
            onSetQuantity={onSetQuantity}
            poolFilters={poolFilters}
            verification={verification}
            zone={zone}
            zonePool={zonePool}
          />
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
