import { FlatList, StyleSheet, View } from "react-native";

import { Chip } from "@/components/ui/atoms/chip";
import { ColorDot } from "@/components/ui/atoms/color-dot";
import { HorizontalScroller } from "@/components/ui/atoms/horizontal-scroller";
import { SearchField } from "@/components/ui/atoms/search-field";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { ORDERED_DOMAINS } from "@/features/card/value-objects/card-domain";
import { fitColumns, useLayoutSize, type ColumnSpec } from "@/hooks/use-layout-size";
import { useDomainColors } from "@/hooks/use-theme";

import type { DeckBuildStep } from "../../../deck-build-steps";
import type { LegendSearchViewState } from "../../../hooks/use-deck-build";
import { BuildFooter } from "../build-footer";
import { LegendPickTile } from "../legend-pick-tile";
import { StepIntro } from "./step-intro";

interface LegendStepProps {
  readonly legends: readonly Card[];
  readonly onLoadMore: () => void;
  readonly onNext: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onPick: (card: Card) => void;
  readonly search: LegendSearchViewState;
  readonly selected: Card | null;
  readonly step: DeckBuildStep;
}

const LEGEND_COLUMNS: ColumnSpec = { gap: Spacing.three - 5, minimum: 170 };

function LegendStep({
  legends,
  onLoadMore,
  onNext,
  onOpenCard,
  onPick,
  search: { domainIds, query, setQuery, toggleDomain },
  selected,
  step,
}: LegendStepProps) {
  const domainColors = useDomainColors();
  const { width } = useLayoutSize();
  const { columns, columnWidth } = fitColumns(width - Spacing.three * 2, LEGEND_COLUMNS);

  return (
    <>
      <FlatList
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        contentContainerStyle={styles.content}
        data={legends}
        key={columns}
        keyExtractor={(card) => card.printingId}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View>
            <StepIntro step={step} />
            <SearchField
              hint="Search legends"
              onChangeQuery={setQuery}
              query={query}
              style={styles.search}
            />
            <HorizontalScroller style={styles.domains}>
              {ORDERED_DOMAINS.map((domainId) => (
                <Chip
                  adornment={<ColorDot color={domainColors[domainId]} />}
                  key={domainId}
                  label={domainId}
                  labelType="body"
                  onPress={() => toggleDomain(domainId)}
                  selected={domainIds.includes(domainId)}
                  tone="neutral"
                />
              ))}
            </HorizontalScroller>
          </View>
        }
        numColumns={columns}
        renderItem={({ item }) => (
          <LegendPickTile
            card={item}
            onOpenCard={onOpenCard}
            onPick={onPick}
            selected={selected?.printingId === item.printingId}
            width={columnWidth}
          />
        )}
        style={styles.list}
      />
      <BuildFooter actionLabel="Continue" onAction={onNext}>
        <ThemedText numberOfLines={1} themeColor="textSecondary" type="mono">
          {selected ? selected.name : "No Legend yet — you can skip"}
        </ThemedText>
      </BuildFooter>
    </>
  );
}

export { LEGEND_COLUMNS, LegendStep };
export type { LegendStepProps };

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  search: {
    marginBottom: Spacing.two + 1,
  },
  domains: {
    marginBottom: Spacing.three - 4,
  },
  row: {
    gap: Spacing.three - 5,
  },
});
