import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { TouchTarget } from "@/constants/theme";

function TextAction({
  accessibilityLabel,
  label,
  onPress,
}: {
  readonly accessibilityLabel?: string;
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <ThemedText themeColor="accent" type="mono">
        {label}
      </ThemedText>
    </Pressable>
  );
}

export { TextAction };

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
  },
  pressed: {
    opacity: 0.7,
  },
});
