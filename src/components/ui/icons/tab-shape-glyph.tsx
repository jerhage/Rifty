import { StyleSheet, View, type ColorValue } from "react-native";

import { Radius } from "@/constants/theme";

type TabShape = "square" | "diamond" | "circle" | "pill";

/**
 * Not in use. The one-box tab glyph the v12 silhouettes replaced, kept deliberately: it is the
 * only drawing here that expresses a destination as a single primitive, and a bar that wants plain
 * shapes again would reach for it rather than rebuild it.
 */
function TabShapeGlyph({ color, shape }: { readonly color: ColorValue; readonly shape: TabShape }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.glyph, { backgroundColor: color }, styles[shape]]}
    />
  );
}

export { TabShapeGlyph };
export type { TabShape };

const styles = StyleSheet.create({
  glyph: {
    height: 16,
    width: 16,
  },
  square: {
    borderRadius: Radius.small - 2,
  },
  diamond: {
    borderRadius: 3,
    transform: [{ rotate: "45deg" }],
  },
  circle: {
    borderRadius: 8,
  },
  pill: {
    borderRadius: 5,
    height: 10,
  },
});
