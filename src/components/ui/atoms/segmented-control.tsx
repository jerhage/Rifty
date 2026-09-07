import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Holds two or more {@link SegmentedOption} children as one connected control. */
function SegmentedControl({ children }: { readonly children: ReactNode }) {
  const theme = useTheme();

  return (
    <View style={[styles.control, { backgroundColor: theme.fill, borderColor: theme.border }]}>
      {children}
    </View>
  );
}

/** One choice within a {@link SegmentedControl}, optionally prefixed by a glyph. */
function SegmentedOption({
  glyph,
  label,
  onPress,
  selected,
}: {
  readonly glyph?: string;
  readonly label: string;
  readonly onPress: () => void;
  readonly selected: boolean;
}) {
  const theme = useTheme();
  const themeColor = selected ? "onAccent" : "textSecondary";

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: selected ? theme.accent : "transparent" },
        pressed && styles.pressed,
      ]}
    >
      {glyph === undefined ? null : (
        <ThemedText themeColor={themeColor} type="monoValue">
          {glyph}
        </ThemedText>
      )}
      <ThemedText themeColor={themeColor} type="small">
        {label}
      </ThemedText>
    </Pressable>
  );
}

export { SegmentedControl, SegmentedOption };

const styles = StyleSheet.create({
  control: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two - 2,
    padding: Spacing.one,
  },
  option: {
    alignItems: "center",
    borderRadius: Radius.medium,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.two - 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
