import { Pressable, StyleSheet, View } from "react-native";

import { SearchField } from "@/components/ui/atoms/search-field";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { FilterGlyph } from "@/components/ui/icons/filter-glyph";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function PoolSearchRow({
  filterCount,
  hint,
  onChangeQuery,
  onOpenFilters,
  query,
}: {
  readonly filterCount: number;
  readonly hint: string;
  readonly onChangeQuery: (query: string) => void;
  readonly onOpenFilters: () => void;
  readonly query: string;
}) {
  const theme = useTheme();
  const isFiltered = filterCount > 0;

  return (
    <View style={styles.row}>
      <SearchField hint={hint} onChangeQuery={onChangeQuery} query={query} style={styles.field} />

      <Pressable
        accessibilityLabel={isFiltered ? `Filters, ${filterCount} active` : "Filters"}
        accessibilityRole="button"
        onPress={onOpenFilters}
        style={({ pressed }) => [
          styles.filter,
          {
            backgroundColor: isFiltered ? theme.accent : theme.fill,
            borderColor: theme.border,
          },
          pressed && styles.pressed,
        ]}
      >
        <FilterGlyph color={isFiltered ? theme.onAccent : theme.textSecondary} />
        <ThemedText themeColor={isFiltered ? "onAccent" : "textSecondary"} type="mono">
          {isFiltered ? `${filterCount}` : "Filter"}
        </ThemedText>
      </Pressable>
    </View>
  );
}

export { PoolSearchRow };

const styles = StyleSheet.create({
  field: {
    flex: 1,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two - 1,
    marginTop: Spacing.two + 1,
  },
  filter: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.one + 2,
    height: 38,
    paddingHorizontal: Spacing.three - 5,
  },
  pressed: {
    opacity: 0.7,
  },
});
