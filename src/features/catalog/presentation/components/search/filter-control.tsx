import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { FilterGlyph } from "@/components/ui/icons/filter-glyph";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Opens the advanced filters, badged with how many facets are currently constrained. */
function FilterControl({
  count,
  onPress,
}: {
  readonly count: number;
  readonly onPress: () => void;
}) {
  const theme = useTheme();
  const isFiltered = count > 0;

  return (
    <Pressable
      accessibilityLabel={isFiltered ? `Advanced filters, ${count} active` : "Advanced filters"}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        { backgroundColor: isFiltered ? theme.accent : theme.fill, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <FilterGlyph color={isFiltered ? theme.onAccent : theme.textSecondary} />
      <ThemedText themeColor={isFiltered ? "onAccent" : "textSecondary"} type="mono">
        {isFiltered ? `${count} active` : "Filter"}
      </ThemedText>
    </Pressable>
  );
}

export { FilterControl };

const styles = StyleSheet.create({
  control: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.one + 1,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
