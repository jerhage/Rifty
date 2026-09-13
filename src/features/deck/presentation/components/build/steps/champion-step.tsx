import { FlatList, StyleSheet } from "react-native";

import { EmptyState } from "@/components/ui/atoms/empty-state";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { fitColumns, useLayoutSize, type ColumnSpec } from "@/hooks/use-layout-size";

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

const CHAMPION_COLUMNS: ColumnSpec = { gap: Spacing.two, minimum: 300 };

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
  const { width } = useLayoutSize();
  const { columns, columnWidth } = fitColumns(
    Math.min(width, MaxContentWidth) - Spacing.three * 2,
    CHAMPION_COLUMNS,
  );

  return (
    <>
      <FlatList
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        contentContainerStyle={styles.content}
        data={champions}
        key={columns}
        keyExtractor={(card) => card.printingId}
        numColumns={columns}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            message={
              legend
                ? `No champions match ${legend.name}'s character tag and domains.`
                : "Pick a Legend first to see which champions it allows."
            }
          />
        }
        ListHeaderComponent={<StepIntro step={step} />}
        renderItem={({ item }) => (
          <ChampionPickRow
            card={item}
            onOpenCard={onOpenCard}
            onPick={onPick}
            selected={selected?.printingId === item.printingId}
            width={columnWidth}
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

export { CHAMPION_COLUMNS, ChampionStep };
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
  row: {
    gap: Spacing.two,
  },
});
