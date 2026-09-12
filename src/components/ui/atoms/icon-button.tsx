import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, TouchTarget } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const FACE_SIZE = 32;

/** A filled square carrying a single glyph, with `hitSlop` taking its 32pt face out to the minimum. */
function IconButton({
  accessibilityLabel,
  glyph,
  onPress,
}: {
  readonly accessibilityLabel: string;
  readonly glyph: string;
  readonly onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={TouchTarget.slop(FACE_SIZE)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.fill },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText type="small">{glyph}</ThemedText>
    </Pressable>
  );
}

export { IconButton };

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: Radius.medium,
    height: FACE_SIZE,
    justifyContent: "center",
    width: FACE_SIZE,
  },
  pressed: {
    opacity: 0.7,
  },
});
