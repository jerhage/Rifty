import { StyleSheet, View } from "react-native";

import { Radius } from "@/constants/theme";

/** The ring standing in for a magnifier in the search field. */
function SearchGlyph({ color }: { readonly color: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.glyph, { borderColor: color }]}
    />
  );
}

export { SearchGlyph };

const styles = StyleSheet.create({
  glyph: {
    borderRadius: Radius.small,
    borderWidth: 1.5,
    height: 11,
    width: 11,
  },
});
