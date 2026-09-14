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
import { SectionsPane } from "../components/build/panes/sections-pane";
import type { DeckBuildCapabilities, DeckBuildMode } from "../deck-build-mode";
import type {
  DeckBuildStepsState,
  DeckDraftState,
  LegendSearchState,
  SectionPoolState,
} from "../hooks/use-deck-build";

interface DeckBuildScreenProps {
  readonly capabilities: DeckBuildCapabilities;
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly draft: DeckDraftState;
  readonly keywords: readonly Keyword[];
  readonly legends: LegendSearchState;
  readonly mode: DeckBuildMode;
  readonly onOpenCard: (card: Card) => void;
  readonly onSaved: () => void;
  readonly pool: SectionPoolState;
  readonly steps: DeckBuildStepsState;
}

/**
 * Each step brings its own pool, so only the step on screen queries the catalog and a slow pool
 * never blocks a step the player is not looking at.
 */
function DeckBuildScreen({
  capabilities,
  cardCounter,
  cardLister,
  draft,
  keywords,
  legends,
  mode,
  onOpenCard,
  onSaved,
  pool,
  steps,
}: DeckBuildScreenProps) {
  return (
    <ThemedView style={styles.screen}>
      <BuildProgressHeader
        mode={steps.mode}
        onBack={steps.back}
        onClose={steps.exit}
        step={steps.step}
      />
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
        .with("sections", () => (
          <SectionsPane
            capabilities={capabilities}
            cardCounter={cardCounter}
            cardLister={cardLister}
            draft={draft}
            keywords={keywords}
            mode={mode}
            onOpenCard={onOpenCard}
            onSaved={onSaved}
            pool={pool}
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
