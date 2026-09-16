import { SymbolView } from "expo-symbols";
import { StyleSheet, View } from "react-native";

/** Sized to stand on one line of body text, which is 19 points tall. */
const BOOKMARK_SIZE = 18;

/**
 * The ribbon mark: a box with a V cut into its foot, outlined while nothing is marked and solid
 * once something is. Filled against outlined is a difference of shape as well as of color, so the
 * mark still reads where the two colors do not.
 *
 * The notch is what makes the shape a bookmark, and React Native has no way to cut one — so the
 * shape comes from the platform's own symbol set, named for both: `bookmark` on iOS and the
 * Material `bookmark_border` elsewhere. `SymbolView` renders the drawn `fallback` wherever neither
 * is available, which keeps a mark on screen rather than a hole.
 *
 * It stays decorative wherever it is used: the control around it carries the role, the name and
 * the state, so a reader is never told "bookmark" twice.
 */
function BookmarkGlyph({ color, filled }: { readonly color: string; readonly filled: boolean }) {
  return (
    <SymbolView
      accessibilityElementsHidden
      fallback={<DrawnBookmark color={color} filled={filled} />}
      importantForAccessibility="no-hide-descendants"
      name={
        filled
          ? { ios: "bookmark.fill", android: "bookmark", web: "bookmark" }
          : { ios: "bookmark", android: "bookmark_border", web: "bookmark_border" }
      }
      size={BOOKMARK_SIZE}
      tintColor={color}
    />
  );
}

/** No notch, because borders cannot cut one: an open-footed box is as close as drawing gets. */
function DrawnBookmark({ color, filled }: { readonly color: string; readonly filled: boolean }) {
  return (
    <View
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
