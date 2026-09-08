import { StyleSheet, View } from "react-native";

function RowsIcon({ color }: { readonly color: string }) {
  return (
    <View style={styles.icon}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.bar, { backgroundColor: color }]} />
    </View>
  );
}

export { RowsIcon };

const styles = StyleSheet.create({
  icon: {
    alignItems: "center",
    gap: 2.5,
    justifyContent: "center",
  },
  bar: {
    borderRadius: 1,
    height: 2,
    width: 14,
  },
});
