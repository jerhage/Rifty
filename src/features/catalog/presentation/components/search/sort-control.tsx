import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import type { CatalogQueryCriteria } from "../../catalog-query-criteria";
import {
  sortDirectionArrow,
  sortDirectionOf,
  sortOptionFor,
  sortOptionLabel,
} from "../../catalog-sort-options";

/**
 * Two targets in one shell: the label opens the sort sheet, while the arrow reverses the order in
 * place. Catalog order has no direction, so it shows no arrow.
 */
function SortControl({
  criteria,
  onOpenSort,
  onToggleDirection,
}: {
  readonly criteria: CatalogQueryCriteria;
  readonly onOpenSort: () => void;
  readonly onToggleDirection: () => void;
}) {
  const theme = useTheme();
  const arrow = sortDirectionArrow(criteria.sort);
  const option = sortOptionFor(criteria.sort);
  const isDescending = sortDirectionOf(criteria.sort) === "descending";

  return (
    <View style={[styles.control, { backgroundColor: theme.fill, borderColor: theme.border }]}>
      <Pressable
        accessibilityLabel={`Sort by ${sortOptionLabel(criteria.sort)}. Change ordering`}
        accessibilityRole="button"
        onPress={onOpenSort}
        style={({ pressed }) => [styles.label, pressed && styles.pressed]}
      >
        <ThemedText themeColor="accent" type="mono">
          {sortOptionLabel(criteria.sort)}
        </ThemedText>
      </Pressable>
      {arrow === null ? null : (
        <>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable
            accessibilityLabel={
              isDescending
                ? `Sorted ${option.descendingLabel}. Switch to ${option.ascendingLabel}`
                : `Sorted ${option.ascendingLabel}. Switch to ${option.descendingLabel}`
            }
            accessibilityRole="button"
            onPress={onToggleDirection}
            style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
          >
            <ThemedText themeColor="accent" type="monoValue">
              {arrow}
            </ThemedText>
          </Pressable>
        </>
      )}
    </View>
  );
}

export { SortControl };

const styles = StyleSheet.create({
  control: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    overflow: "hidden",
  },
  label: {
    justifyContent: "center",
    paddingHorizontal: Spacing.two + 1,
    paddingVertical: Spacing.one + 2,
  },
  arrow: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.two + 1,
    paddingVertical: Spacing.one + 2,
  },
  divider: {
    alignSelf: "stretch",
    width: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.7,
  },
});
