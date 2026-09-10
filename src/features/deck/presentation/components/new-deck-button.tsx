import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** The dashed row doubles as the empty state, so an empty list still offers the one useful action. */
function NewDeckButton({ onPress }: { readonly onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel="Create a new deck"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { borderColor: theme.borderStrong },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText themeColor="textSecondary" type="body">
        + New deck
      </ThemedText>
    </Pressable>
  );
}

export { NewDeckButton };

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: Radius.large,
    borderStyle: "dashed",
    borderWidth: 1,
    padding: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
