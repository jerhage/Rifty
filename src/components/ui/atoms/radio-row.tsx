import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** A single-choice row: marker, label, and a note explaining what choosing it means. */
function RadioRow({
  label,
  note,
  onPress,
  selected,
}: {
  readonly label: string;
  readonly note: string;
  readonly onPress: () => void;
  readonly selected: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: selected ? theme.fill : "transparent" },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.marker,
          {
            backgroundColor: selected ? theme.accent : "transparent",
            borderColor: theme.borderStrong,
          },
        ]}
      />
      <View style={styles.text}>
        <ThemedText themeColor={selected ? "text" : "textSecondary"} type="small">
          {label}
        </ThemedText>
        <ThemedText themeColor="textTertiary" type="body" style={styles.note}>
          {note}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export { RadioRow };

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderRadius: Radius.medium,
    flexDirection: "row",
    gap: Spacing.three - 4,
    minHeight: 44,
    padding: Spacing.three - 4,
  },
  marker: {
    borderRadius: 999,
    borderWidth: 1.5,
    height: 12,
    width: 12,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  note: {
    marginTop: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
});
