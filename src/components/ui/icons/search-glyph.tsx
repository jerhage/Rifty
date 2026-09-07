import { StyleSheet, View } from "react-native";

import { Radius } from "@/constants/theme";

/** The outline ring that stands in for a magnifier inside the search field. */
function SearchGlyph({ color }: { readonly color: string }) {
  return <View style={[styles.glyph, { borderColor: color }]} />;
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
