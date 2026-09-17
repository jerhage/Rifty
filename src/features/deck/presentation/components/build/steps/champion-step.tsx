import { FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { match } from "ts-pattern";

import { EmptyState } from "@/components/ui/atoms/empty-state";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { useColumnFit, type ColumnSpec } from "@/hooks/use-layout-size";

import { isPickOf, type DeckBuildPick, type DeckBuildStep } from "../../../deck-build-steps";
import { BuildFooter } from "../build-footer";
import { ChampionPickRow } from "../champion-pick-row";
import { StepIntro } from "./step-intro";

interface ChampionStepProps {
  readonly champions: readonly Card[];
  readonly legend: DeckBuildPick;
  readonly onLoadMore: () => void;
  readonly onNext: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onPick: (card: Card) => void;
  readonly selected: DeckBuildPick;
  readonly step: DeckBuildStep;
}

const CHAMPION_COLUMNS: ColumnSpec = {
  gap: Spacing.two,
  minimum: 300,
  sidePadding: Spacing.three,
};

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
  const insets = useSafeAreaInsets();
  const { columns, columnWidth } = useColumnFit(CHAMPION_COLUMNS);

  return (
    <>
      <FlatList
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        contentContainerStyle={[
          styles.content,
          {
            paddingLeft: insets.left + CHAMPION_COLUMNS.sidePadding,
            paddingRight: insets.right + CHAMPION_COLUMNS.sidePadding,
          },
        ]}
        data={champions}
        key={columns}
        keyExtractor={(card) => card.printingId}
        numColumns={columns}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<EmptyState message={emptyPoolMessage(legend)} />}
        ListHeaderComponent={<StepIntro step={step} />}
        renderItem={({ item }) => (
          <ChampionPickRow
            card={item}
            onOpenCard={onOpenCard}
            onPick={onPick}
            selected={isPickOf(selected, item)}
            width={columnWidth}
          />
        )}
        style={styles.list}
      />
      <BuildFooter actionAvailability="ready" actionLabel="Build sections" onAction={onNext}>
        <ThemedText numberOfLines={1} themeColor="textSecondary" type="mono">
          {championLabel(selected)}
        </ThemedText>
      </BuildFooter>
    </>
  );
}

function emptyPoolMessage(legend: DeckBuildPick): string {
  return match(legend)
    .with({ type: "notPicked" }, () => "Pick a Legend first to see which champions it allows.")
    .with(
      { type: "picked" },
      ({ card }) => `No champions match ${card.name}'s champion and domains.`,
    )
    .exhaustive();
}

function championLabel(selected: DeckBuildPick): string {
  return match(selected)
    .with({ type: "notPicked" }, () => "No Chosen Champion yet — you can skip")
    .with({ type: "picked" }, ({ card }) => card.name)
    .exhaustive();
}

export { CHAMPION_COLUMNS, ChampionStep };
export type { ChampionStepProps };

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  row: {
    gap: Spacing.two,
  },
});
