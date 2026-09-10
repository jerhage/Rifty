import { StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedView } from "@/components/ui/atoms/themed-view";
import type { Card } from "@/features/card/card";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";
import type { Keyword } from "@/features/card/keyword/keyword";

import { BuildProgressHeader } from "../components/build/build-progress-header";
import { ChampionPane } from "../components/build/panes/champion-pane";
import { LegendPane } from "../components/build/panes/legend-pane";
import { ZonesPane } from "../components/build/panes/zones-pane";
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
          <LegendPane
            cardCounter={cardCounter}
            cardLister={cardLister}
            draft={draft}
            legends={legends}
            onOpenCard={onOpenCard}
            steps={steps}
          />
        ))
        .with("chosenChampion", () => (
          <ChampionPane
            cardCounter={cardCounter}
            cardLister={cardLister}
            draft={draft}
            onOpenCard={onOpenCard}
            steps={steps}
          />
        ))
        .with("zones", () => (
          <ZonesPane
            cardCounter={cardCounter}
            cardLister={cardLister}
            draft={draft}
            keywords={keywords}
            onOpenCard={onOpenCard}
            pool={pool}
            saving={saving}
            steps={steps}
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
