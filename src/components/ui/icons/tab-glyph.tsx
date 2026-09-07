import { StyleSheet, View, type ColorValue } from "react-native";

import { Radius } from "@/constants/theme";

type TabGlyphShape = "square" | "diamond";

function TabGlyph({ color, shape }: { readonly color: ColorValue; readonly shape: TabGlyphShape }) {
  return (
    <View
      style={[
        styles.glyph,
        { backgroundColor: color },
        shape === "diamond" ? styles.diamond : styles.square,
      ]}
    />
  );
}

export { TabGlyph };
export type { TabGlyphShape };

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
});
