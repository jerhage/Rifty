import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import { CardSortControl } from "@/features/card/presentation/components/card-sort-control";

import { activeFilterCount, type CatalogQueryCriteria } from "../../catalog-query-criteria";
import { BookmarkedFilterControl } from "./bookmarked-filter-control";
import { FilterControl } from "./filter-control";

function CatalogResultBar({
  bookmarkedCount,
  criteria,
  onOpenFilters,
  onOpenSort,
  onToggleOnlyBookmarked,
  onToggleSortDirection,
  resultCount,
  total,
}: {
  readonly bookmarkedCount: number;
  readonly criteria: CatalogQueryCriteria;
  readonly onOpenFilters: () => void;
  readonly onOpenSort: () => void;
  readonly onToggleOnlyBookmarked: () => void;
  readonly onToggleSortDirection: () => void;
  readonly resultCount: number;
  readonly total: number;
}) {
  return (
    <View style={styles.bar}>
      <ThemedText accessibilityLiveRegion="polite" themeColor="textTertiary" type="mono">
        {countLabel(resultCount, total)}
      </ThemedText>
      <View style={styles.controls}>
        <BookmarkedFilterControl
          count={bookmarkedCount}
          onPress={onToggleOnlyBookmarked}
          selected={criteria.onlyBookmarked ?? false}
        />
        <FilterControl count={activeFilterCount(criteria)} onPress={onOpenFilters} />
        <CardSortControl
          onOpenSort={onOpenSort}
          onToggleDirection={onToggleSortDirection}
          sort={criteria.sort}
        />
      </View>
    </View>
  );
}

function countLabel(shown: number, total: number): string {
  if (total === 0) return "no cards";
  if (shown >= total) return total === 1 ? "1 card" : `${total} cards`;

  return `${shown} of ${total} cards`;
}

export { CatalogResultBar };

const styles = StyleSheet.create({
  bar: {
    gap: Spacing.two + 1,
    paddingBottom: Spacing.three - 3,
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two - 1,
  },
});
