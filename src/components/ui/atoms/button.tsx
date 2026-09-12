import { Pressable, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ButtonVariant = "primary" | "secondary" | "link";

const LINK_UNDERLINE_WIDTH = 1;
const LINK_TEXT_HEIGHT = 20;
const LINK_FACE_HEIGHT = LINK_TEXT_HEIGHT + Spacing.one + LINK_UNDERLINE_WIDTH;
const LINK_HIT_SLOP = {
  bottom: TouchTarget.slop(LINK_FACE_HEIGHT),
  left: TouchTarget.slop(0),
  right: TouchTarget.slop(0),
  top: TouchTarget.slop(LINK_FACE_HEIGHT),
};

function Button({
  busy = false,
  disabled = false,
  label,
  onPress,
  variant,
}: {
  readonly busy?: boolean;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onPress: () => void;
  readonly variant: ButtonVariant;
}) {
  const theme = useTheme();
  const hitSlop = match(variant)
    .with("link", () => LINK_HIT_SLOP)
    .with("primary", "secondary", () => undefined)
    .exhaustive();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => pressed && !disabled && styles.pressed}
    >
      {match(variant)
        .with("primary", () => (
          <View style={[styles.primary, { backgroundColor: disabled ? theme.fill : theme.accent }]}>
            <ThemedText themeColor={disabled ? "textTertiary" : "onAccent"} type="smallBold">
              {label}
            </ThemedText>
          </View>
        ))
        .with("secondary", () => (
          <ThemedView type="backgroundSelected" style={styles.secondary}>
            <ThemedText type="smallBold">{label}</ThemedText>
          </ThemedView>
        ))
        .with("link", () => (
          <View style={[styles.link, { borderBottomColor: theme.accent }]}>
            <ThemedText style={{ color: theme.accent }} type="smallBold">
              {label}
            </ThemedText>
          </View>
        ))
        .exhaustive()}
    </Pressable>
  );
}

export { Button };
export type { ButtonVariant };

const styles = StyleSheet.create({
  primary: {
    alignItems: "center",
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.four - 2,
    paddingVertical: Spacing.three - 3,
  },
  secondary: {
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  link: {
    alignSelf: "flex-start",
    borderBottomWidth: LINK_UNDERLINE_WIDTH,
    paddingBottom: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
