import { StyleSheet, View } from "react-native";

import { Radius } from "@/constants/theme";

function ColorDot({ color, size = 7 }: { readonly color: string; readonly size?: number }) {
  return <View style={[styles.dot, { backgroundColor: color, height: size, width: size }]} />;
}

export { ColorDot };

const styles = StyleSheet.create({
  dot: {
    borderRadius: Radius.small,
  },
});
