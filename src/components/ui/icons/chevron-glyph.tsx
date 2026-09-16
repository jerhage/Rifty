import { StyleSheet, View, type ViewStyle } from "react-native";

type ChevronDirection = "left" | "right";

/** Two borders of a square, turned a quarter of the way round, are the arms of the chevron. */
const CHEVRON_ARMS: Readonly<Record<ChevronDirection, ViewStyle>> = {
  left: { borderLeftWidth: 1.5, borderTopWidth: 1.5 },
  right: { borderBottomWidth: 1.5, borderRightWidth: 1.5 },
};

function ChevronGlyph({
  color,
  direction,
}: {
  readonly color: string;
  readonly direction: ChevronDirection;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.glyph, CHEVRON_ARMS[direction], { borderColor: color }]}
    />
  );
}

export { ChevronGlyph };
export type { ChevronDirection };

const styles = StyleSheet.create({
  glyph: {
    height: 7,
    transform: [{ rotate: "45deg" }],
    width: 7,
  },
});
