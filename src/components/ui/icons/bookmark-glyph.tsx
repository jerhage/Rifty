import { StyleSheet, View } from "react-native";

/**
 * The ribbon mark: a box open at the foot, drawn as an outline while nothing is marked and solid
 * once something is. Filled against outlined is a difference of shape, so the mark still reads
 * where its two colors do not.
 */
function BookmarkGlyph({ color, filled }: { readonly color: string; readonly filled: boolean }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.glyph,
        { borderColor: color },
        filled ? { backgroundColor: color } : styles.outline,
      ]}
    />
  );
}

export { BookmarkGlyph };

const styles = StyleSheet.create({
  glyph: {
    borderBottomWidth: 0,
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
    borderWidth: 1.5,
    height: 15,
    width: 11,
  },
  outline: {
    backgroundColor: "transparent",
  },
});
