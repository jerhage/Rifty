import { Pressable, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ButtonVariant = "primary" | "secondary" | "link";

function Button({
  label,
  onPress,
  variant,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant: ButtonVariant;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {match(variant)
        .with("primary", () => (
          <View style={[styles.primary, { backgroundColor: theme.accent }]}>
            <ThemedText themeColor="onAccent" type="smallBold">
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
    paddingVertical: Spacing.three - 3,
  },
  secondary: {
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
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
