import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { FilterGlyph } from "@/components/ui/icons/filter-glyph";
import { SearchGlyph } from "@/components/ui/icons/search-glyph";
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
      <View style={[styles.field, { backgroundColor: theme.fill, borderColor: theme.border }]}>
        <SearchGlyph color={theme.textSecondary} />
        <TextInput
          accessibilityLabel={hint}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeQuery}
          placeholder={hint}
          placeholderTextColor={theme.textTertiary}
          style={[styles.input, { color: theme.text }]}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            onPress={() => onChangeQuery("")}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <ThemedText themeColor="textSecondary" type="mono">
              Clr
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

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
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two - 1,
    marginTop: Spacing.two + 1,
  },
  field: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.two + 1,
    height: 38,
    minWidth: 0,
    paddingHorizontal: Spacing.three - 5,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    minWidth: 0,
    padding: 0,
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
