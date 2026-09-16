import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Opens the contents over the document. Only a screen with nowhere to stand them beside it has one. */
function CoreRulesContentsControl({ onPress }: { readonly onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel="Contents"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        { backgroundColor: theme.fill, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText themeColor="textSecondary" type="mono">
        Contents
      </ThemedText>
    </Pressable>
  );
}

export { CoreRulesContentsControl };

const styles = StyleSheet.create({
  control: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    paddingHorizontal: Spacing.three - 3,
  },
  pressed: {
    opacity: 0.7,
  },
});
