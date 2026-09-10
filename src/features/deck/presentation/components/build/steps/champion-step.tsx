import { FlatList, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";

import type { DeckBuildStep } from "../../../deck-build-steps";
import { BuildFooter } from "../build-footer";
import { ChampionPickRow } from "../champion-pick-row";
import { StepIntro } from "./step-intro";

interface ChampionStepProps {
  readonly champions: readonly Card[];
  readonly legend: Card | null;
  readonly onLoadMore: () => void;
  readonly onNext: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onPick: (card: Card) => void;
  readonly selected: Card | null;
  readonly step: DeckBuildStep;
}

function ChampionStep({
  champions,
  legend,
  onLoadMore,
  onNext,
  onOpenCard,
  onPick,
  selected,
  step,
}: ChampionStepProps) {
  return (
    <>
      <FlatList
        contentContainerStyle={styles.content}
        data={champions}
        keyExtractor={(card) => card.printingId}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" type="body" style={styles.empty}>
            {legend
              ? `No champions match ${legend.name}'s character tag and domains.`
              : "Pick a Legend first to see which champions it allows."}
          </ThemedText>
        }
        ListHeaderComponent={<StepIntro step={step} />}
        renderItem={({ item }) => (
          <ChampionPickRow
            card={item}
            onOpenCard={onOpenCard}
            onPick={onPick}
            selected={selected?.printingId === item.printingId}
          />
        )}
        style={styles.list}
      />
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
  list: {
    flex: 1,
  },
  content: {
    alignSelf: "center",
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    paddingBottom: Spacing.four,
    paddingHorizontal: Spacing.three,
    width: "100%",
  },
  empty: {
    paddingVertical: Spacing.six,
    textAlign: "center",
  },
});
