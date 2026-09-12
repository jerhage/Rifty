import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type SegmentedSize = "regular" | "compact";

/**
 * What activating an option does. `tab` swaps the pane below the control; `radio` picks one value
 * out of a set. There is no default: the two announce differently and the caller knows which it is.
 */
type SegmentedOptionRole = "radio" | "tab";

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
  accessibilityLabel,
  glyph,
  icon,
  label,
  onPress,
  role,
  selected,
  size = "regular",
}: {
  /** Spoken in place of the visible label, for a label whose punctuation reads badly. */
  readonly accessibilityLabel?: string;
  readonly glyph?: string;
  readonly icon?: (color: string) => ReactNode;
  readonly label: string;
  readonly onPress: () => void;
  readonly role: SegmentedOptionRole;
  readonly selected: boolean;
  readonly size?: SegmentedSize;
}) {
  const theme = useTheme();
  const themeColor = selected ? "onAccent" : "textSecondary";

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole={role}
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
export type { SegmentedOptionRole, SegmentedSize };

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
    minHeight: TouchTarget.minimum,
    paddingHorizontal: Spacing.two,
  },
  compactOption: {
    minHeight: TouchTarget.minimum,
    paddingHorizontal: Spacing.one,
  },
  grow: {
    flex: 1,
    minWidth: 0,
  },
  iconOption: {
    width: TouchTarget.minimum,
  },
  compactLabel: {
    fontSize: 12.5,
    fontWeight: 600,
  },
  pressed: {
    opacity: 0.7,
  },
});
