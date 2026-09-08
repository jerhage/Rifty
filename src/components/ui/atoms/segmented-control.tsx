import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type SegmentedSize = "regular" | "compact";

function SegmentedControl({
  children,
  size = "regular",
}: {
  readonly children: ReactNode;
  readonly size?: SegmentedSize;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.control,
        size === "compact" && styles.compactControl,
        { backgroundColor: theme.fill, borderColor: theme.border },
      ]}
    >
      {children}
    </View>
  );
}

function SegmentedOption({
  glyph,
  icon,
  label,
  onPress,
  selected,
  size = "regular",
}: {
  readonly glyph?: string;
  readonly icon?: (color: string) => ReactNode;
  readonly label: string;
  readonly onPress: () => void;
  readonly selected: boolean;
  readonly size?: SegmentedSize;
}) {
  const theme = useTheme();
  const themeColor = selected ? "onAccent" : "textSecondary";

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        size === "compact" ? styles.compactOption : styles.regularOption,
        icon === undefined ? styles.grow : styles.iconOption,
        { backgroundColor: selected ? theme.accent : "transparent" },
        pressed && styles.pressed,
      ]}
    >
      {icon === undefined ? (
        <>
          {glyph === undefined ? null : (
            <ThemedText themeColor={themeColor} type="monoValue">
              {glyph}
            </ThemedText>
          )}
          <ThemedText
            numberOfLines={1}
            style={size === "compact" ? styles.compactLabel : undefined}
            themeColor={themeColor}
            type="small"
          >
            {label}
          </ThemedText>
        </>
      ) : (
        icon(theme[themeColor])
      )}
    </Pressable>
  );
}

export { SegmentedControl, SegmentedOption };
export type { SegmentedSize };

const styles = StyleSheet.create({
  control: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two - 2,
    padding: Spacing.one,
  },
  compactControl: {
    gap: 3,
    padding: 3,
  },
  option: {
    alignItems: "center",
    borderRadius: Radius.medium,
    flexDirection: "row",
    gap: Spacing.two - 1,
    justifyContent: "center",
  },
  regularOption: {
    minHeight: 44,
    paddingHorizontal: Spacing.two,
  },
  compactOption: {
    minHeight: 30,
    paddingHorizontal: Spacing.one,
  },
  grow: {
    flex: 1,
    minWidth: 0,
  },
  iconOption: {
    width: 34,
  },
  compactLabel: {
    fontSize: 12.5,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.7,
  },
});
