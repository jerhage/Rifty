import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";

import { activeFilterCount, type CatalogQueryCriteria } from "../../catalog-query-criteria";
import { FilterControl } from "./filter-control";
import { SortControl } from "./sort-control";

/** The result count, with the filter and sort controls beneath it. */
function CatalogResultBar({
  criteria,
  onOpenFilters,
  onOpenSort,
  onToggleSortDirection,
  resultCount,
}: {
  readonly criteria: CatalogQueryCriteria;
  readonly onOpenFilters: () => void;
  readonly onOpenSort: () => void;
  readonly onToggleSortDirection: () => void;
  readonly resultCount: number;
}) {
  return (
    <View style={styles.bar}>
      <ThemedText themeColor="textTertiary" type="mono">
        {resultCount === 1 ? "1 card" : `${resultCount} cards`}
      </ThemedText>
      <View style={styles.controls}>
        <FilterControl count={activeFilterCount(criteria)} onPress={onOpenFilters} />
        <SortControl
          criteria={criteria}
          onOpenSort={onOpenSort}
          onToggleDirection={onToggleSortDirection}
        />
      </View>
    </View>
  );
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
    gap: Spacing.two - 1,
  },
});
