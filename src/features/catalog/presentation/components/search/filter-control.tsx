import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { FilterGlyph } from "@/components/ui/icons/filter-glyph";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const FACE_HEIGHT = 26;
const OUTWARD_SLOP = TouchTarget.slop(FACE_HEIGHT);
const CONTROL_SLOP = { bottom: OUTWARD_SLOP, top: OUTWARD_SLOP };

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
      hitSlop={CONTROL_SLOP}
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
    justifyContent: "center",
    minHeight: FACE_HEIGHT,
    minWidth: TouchTarget.minimum,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
