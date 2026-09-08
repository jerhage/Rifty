import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import type { Card } from "@/features/catalog/card/card";

import type { DeckBuildStep } from "../../../deck-build-steps";
import { BuildFooter } from "../build-footer";
import { LegendPickTile } from "../legend-pick-tile";
import { StepIntro } from "./step-intro";

interface LegendStepProps {
  readonly legends: readonly Card[];
  readonly onNext: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onPick: (card: Card) => void;
  readonly selected: Card | null;
  readonly step: DeckBuildStep;
}

function LegendStep({ legends, onNext, onOpenCard, onPick, selected, step }: LegendStepProps) {
  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll}>
        <StepIntro step={step} />
        <View style={styles.grid}>
          {legends.map((card) => (
            <LegendPickTile
              card={card}
              key={card.id}
              onOpenCard={onOpenCard}
              onPick={onPick}
              selected={selected?.id === card.id}
            />
          ))}
        </View>
      </ScrollView>
      <BuildFooter actionLabel="Continue" onAction={onNext}>
        <ThemedText numberOfLines={1} themeColor="textSecondary" type="mono">
          {selected ? selected.name : "No Legend yet — you can skip"}
        </ThemedText>
      </BuildFooter>
    </>
  );
}

export { LegendStep };
export type { LegendStepProps };

const styles = StyleSheet.create({
  scroll: {
    alignSelf: "center",
    maxWidth: MaxContentWidth,
    paddingBottom: Spacing.four,
    width: "100%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three - 5,
    paddingHorizontal: Spacing.three,
  },
});
