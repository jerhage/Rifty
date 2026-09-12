import { Pressable, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ButtonVariant = "primary" | "secondary" | "link";

function Button({
  disabled = false,
  label,
  onPress,
  variant,
}: {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onPress: () => void;
  readonly variant: ButtonVariant;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
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
          <View style={styles.linkTarget}>
            <View style={[styles.link, { borderBottomColor: theme.accent }]}>
              <ThemedText style={{ color: theme.accent }} type="smallBold">
                {label}
              </ThemedText>
            </View>
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
  linkTarget: {
    alignItems: "flex-start",
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
  },
  link: {
    alignSelf: "flex-start",
    borderBottomWidth: 1,
    paddingBottom: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
