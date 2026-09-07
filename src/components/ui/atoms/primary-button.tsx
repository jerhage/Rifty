import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function PrimaryButton({
  label,
  onPress,
}: {
  readonly label: string;
  readonly onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.accent },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText themeColor="onAccent" type="smallBold">
        {label}
      </ThemedText>
    </Pressable>
  );
}

export { PrimaryButton };

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: Radius.medium,
    paddingVertical: Spacing.three - 3,
  },
  pressed: {
    opacity: 0.7,
  },
});
