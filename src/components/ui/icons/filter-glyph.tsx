import { StyleSheet, View } from "react-native";

/** Three descending rules, the shorthand for "filters" throughout the catalog. */
function FilterGlyph({ color }: { readonly color: string }) {
  return (
    <View style={styles.glyph}>
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
