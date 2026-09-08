import { StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedView } from "@/components/ui/atoms/themed-view";
import type { Card } from "@/features/catalog/card/card";
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
  readonly legends: readonly Card[];
  readonly onBack: () => void;
  readonly onChangeName: (name: string) => void;
  readonly onChangePoolQuery: (query: string) => void;
  readonly onEditStep: (index: number) => void;
  readonly onNext: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onOpenPoolFilters: () => void;
  readonly onPickChampion: (card: Card) => void;
  readonly onPickLegend: (card: Card) => void;
  readonly onSave: () => void;
  readonly onSelectZone: (section: DeckSection) => void;
  readonly onSetQuantity: (section: DeckSection, card: Card, quantity: number) => void;
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
  legends,
  onBack,
  onChangeName,
  onChangePoolQuery,
  onEditStep,
  onNext,
  onOpenCard,
  onOpenPoolFilters,
  onPickChampion,
  onPickLegend,
  onSave,
  onSelectZone,
  onSetQuantity,
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
            onNext={onNext}
            onOpenCard={onOpenCard}
            onPick={onPickLegend}
            selected={draft.legend}
            step={step}
          />
        ))
        .with("chosenChampion", () => (
          <ChampionStep
            champions={champions}
            legend={draft.legend}
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
            onOpenCard={onOpenCard}
            onOpenPoolFilters={onOpenPoolFilters}
            onSave={onSave}
            onSelectZone={onSelectZone}
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
