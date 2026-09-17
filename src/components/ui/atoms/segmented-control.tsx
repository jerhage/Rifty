import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type SegmentedSize = "regular" | "compact";

/**
 * What activating an option does. `tab` swaps the pane below the control; `radio` picks one value
 * out of a set. There is no default: the two announce differently and the caller knows which it is.
 */
type SegmentedOptionRole = "radio" | "tab";

type SegmentedOptionContent =
  | { readonly type: "label"; readonly label: string }
  | { readonly type: "glyphLabel"; readonly glyph: string; readonly label: string }
  | { readonly type: "icon"; readonly icon: (color: string) => ReactNode; readonly label: string };

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
  content,
  onPress,
  role,
  selected,
  size = "regular",
}: {
  /** Spoken in place of the visible label, for a label whose punctuation reads badly. */
  readonly accessibilityLabel?: string;
  readonly content: SegmentedOptionContent;
  readonly onPress: () => void;
  readonly role: SegmentedOptionRole;
  readonly selected: boolean;
  readonly size?: SegmentedSize;
}) {
  const theme = useTheme();
  const themeColor: ThemeColor = selected ? "onAccent" : "textSecondary";

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? content.label}
      accessibilityRole={role}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        size === "compact" ? styles.compactOption : styles.regularOption,
        WIDTH_STYLE_BY_CONTENT_TYPE[content.type],
        { backgroundColor: selected ? theme.accent : "transparent" },
        pressed && styles.pressed,
      ]}
    >
      {match(content)
        .returnType<ReactNode>()
        .with({ type: "label" }, ({ label }) => (
          <SegmentedOptionLabel label={label} size={size} themeColor={themeColor} />
        ))
        .with({ type: "glyphLabel" }, ({ glyph, label }) => (
          <>
            <ThemedText themeColor={themeColor} type="monoValue">
              {glyph}
            </ThemedText>
            <SegmentedOptionLabel label={label} size={size} themeColor={themeColor} />
          </>
        ))
        .with({ type: "icon" }, ({ icon }) => icon(theme[themeColor]))
        .exhaustive()}
    </Pressable>
  );
}

function SegmentedOptionLabel({
  label,
  size,
  themeColor,
}: {
  readonly label: string;
  readonly size: SegmentedSize;
  readonly themeColor: ThemeColor;
}) {
  return (
    <ThemedText
      numberOfLines={1}
      style={size === "compact" ? styles.compactLabel : undefined}
      themeColor={themeColor}
      type="small"
    >
      {label}
    </ThemedText>
  );
}

export { SegmentedControl, SegmentedOption };
export type { SegmentedOptionContent, SegmentedOptionRole, SegmentedSize };

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

const WIDTH_STYLE_BY_CONTENT_TYPE: Readonly<Record<SegmentedOptionContent["type"], ViewStyle>> = {
  label: styles.grow,
  glyphLabel: styles.grow,
  icon: styles.iconOption,
};
