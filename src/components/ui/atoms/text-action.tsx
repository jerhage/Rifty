import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";

function TextAction({ label, onPress }: { readonly label: string; readonly onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <ThemedText themeColor="accent" type="mono">
        {label}
      </ThemedText>
    </Pressable>
  );
}

export { TextAction };

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
});
