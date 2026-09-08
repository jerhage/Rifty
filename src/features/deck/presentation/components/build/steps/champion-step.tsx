import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import type { Card } from "@/features/catalog/card/card";

import type { DeckBuildStep } from "../../../deck-build-steps";
import { BuildFooter } from "../build-footer";
import { ChampionPickRow } from "../champion-pick-row";
import { StepIntro } from "./step-intro";

interface ChampionStepProps {
  readonly champions: readonly Card[];
  readonly legend: Card | null;
  readonly onNext: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onPick: (card: Card) => void;
  readonly selected: Card | null;
  readonly step: DeckBuildStep;
}

function ChampionStep({
  champions,
  legend,
  onNext,
  onOpenCard,
  onPick,
  selected,
  step,
}: ChampionStepProps) {
  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll}>
        <StepIntro step={step} />
        <View style={styles.list}>
          {champions.map((card) => (
            <ChampionPickRow
              card={card}
              key={card.id}
              onOpenCard={onOpenCard}
              onPick={onPick}
              selected={selected?.id === card.id}
            />
          ))}
          {champions.length === 0 ? (
            <ThemedText themeColor="textSecondary" type="body" style={styles.empty}>
              {legend
                ? `No champions match ${legend.name}'s character tag and domains.`
                : "Pick a Legend first to see which champions it allows."}
            </ThemedText>
          ) : null}
        </View>
      </ScrollView>
      <BuildFooter actionLabel="Build zones" onAction={onNext}>
        <ThemedText numberOfLines={1} themeColor="textSecondary" type="mono">
          {selected ? selected.name : "No Champion yet — you can skip"}
        </ThemedText>
      </BuildFooter>
    </>
  );
}

export { ChampionStep };
export type { ChampionStepProps };

const styles = StyleSheet.create({
  scroll: {
    alignSelf: "center",
    maxWidth: MaxContentWidth,
    paddingBottom: Spacing.four,
    width: "100%",
  },
  list: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  empty: {
    paddingVertical: Spacing.six,
    textAlign: "center",
  },
});
