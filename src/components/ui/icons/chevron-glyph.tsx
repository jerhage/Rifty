import { StyleSheet, View, type ViewStyle } from "react-native";

type ChevronDirection = "up" | "right" | "down" | "left";

/**
 * Two borders of a square are the arms of the chevron, and the corner where they meet is its
 * vertex. The square is turned 45° clockwise, which carries that corner a quarter of the way round:
 * the top-left lands at the top, the top-right at the right, the bottom-right at the bottom, and
 * the bottom-left at the left.
 *
 * **Named 2026-09-16.** The pairs were right; two of the four names were not. `left` was the
 * top-left corner, which points up, and `right` was the bottom-right, which points down. The
 * drawings never changed — the two that were being asked for by the wrong name now have their own.
 */
const CHEVRON_ARMS: Readonly<Record<ChevronDirection, ViewStyle>> = {
  up: { borderLeftWidth: 1.5, borderTopWidth: 1.5 },
  right: { borderRightWidth: 1.5, borderTopWidth: 1.5 },
  down: { borderBottomWidth: 1.5, borderRightWidth: 1.5 },
  left: { borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
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

export { CHEVRON_ARMS, ChevronGlyph };
export type { ChevronDirection };

const styles = StyleSheet.create({
  glyph: {
    height: 7,
    transform: [{ rotate: "45deg" }],
    width: 7,
  },
});
