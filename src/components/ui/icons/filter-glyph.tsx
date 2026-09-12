import { StyleSheet, View } from "react-native";

/** The three-bar mark used for filters. */
function FilterGlyph({ color }: { readonly color: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.glyph}
    >
      {[9, 6, 3].map((width) => (
        <View key={width} style={[styles.bar, { backgroundColor: color, width }]} />
      ))}
    </View>
  );
}

export { FilterGlyph };

const styles = StyleSheet.create({
  glyph: {
    gap: 2,
  },
  bar: {
    borderRadius: 1,
    height: 1.5,
  },
});
