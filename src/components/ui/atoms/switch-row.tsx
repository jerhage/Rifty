import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const TRACK_PADDING = 2;
const KNOB_SIZE = 18;

function SwitchRow({
  checked,
  label,
  note,
  onToggle,
}: {
  readonly checked: boolean;
  readonly label: string;
  readonly note: string;
  readonly onToggle: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.fill, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.text}>
        <ThemedText type="small">{label}</ThemedText>
        <ThemedText themeColor="textTertiary" type="body" style={styles.note}>
          {note}
        </ThemedText>
      </View>
      <View
        style={[
          styles.track,
          {
            backgroundColor: checked ? theme.accent : theme.borderStrong,
            justifyContent: checked ? "flex-end" : "flex-start",
          },
        ]}
      >
        <View style={[styles.knob, { backgroundColor: theme.background }]} />
      </View>
    </Pressable>
  );
}

export { SwitchRow };

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.three - 4,
    minHeight: TouchTarget.minimum,
    padding: Spacing.three - 4,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  note: {
    marginTop: Spacing.half,
  },
  track: {
    borderRadius: 999,
    flexDirection: "row",
    padding: TRACK_PADDING,
    width: KNOB_SIZE * 2 + TRACK_PADDING * 2,
  },
  knob: {
    borderRadius: 999,
    height: KNOB_SIZE,
    width: KNOB_SIZE,
  },
  pressed: {
    opacity: 0.7,
  },
});
