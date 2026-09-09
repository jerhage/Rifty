import { StyleSheet, View } from "react-native";

import { ColorDot, type ColorDotShape } from "@/components/ui/atoms/color-dot";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";

function DetailPill({
  color,
  label,
  markerShape = "dot",
}: {
  readonly color: string;
  readonly label: string;
  readonly markerShape?: ColorDotShape;
}) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <ColorDot color={color} shape={markerShape} />
      <ThemedText style={{ color }} type="small">
        {label}
      </ThemedText>
    </View>
  );
}

export { DetailPill };

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 1,
  },
});
