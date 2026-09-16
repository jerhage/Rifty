import { StyleSheet, View } from "react-native";

/** Three stacked bars, the last one short, sized to stand on one line of body text. */
const NOTES_BAR_WIDTH = 13;
const NOTES_LAST_BAR_WIDTH = 9;
const NOTES_BAR_HEIGHT = 1.5;

/**
 * Written lines. It stays decorative wherever it is used: the control around it carries the role,
 * the name and the count, so a reader is never told "notes" twice.
 */
function NotesGlyph({ color }: { readonly color: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.glyph}
    >
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.bar, styles.last, { backgroundColor: color }]} />
    </View>
  );
}

export { NotesGlyph };

const styles = StyleSheet.create({
  glyph: {
    alignItems: "center",
    gap: 2,
  },
  bar: {
    borderRadius: 1,
    height: NOTES_BAR_HEIGHT,
    width: NOTES_BAR_WIDTH,
  },
  last: {
    width: NOTES_LAST_BAR_WIDTH,
  },
});
