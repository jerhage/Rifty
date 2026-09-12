import { StyleSheet, View } from "react-native";

function GridIcon({ color }: { readonly color: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.icon}
    >
      {[0, 1, 2, 3].map((cell) => (
        <View key={cell} style={[styles.cell, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

export { GridIcon };

const styles = StyleSheet.create({
  icon: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2.5,
    width: 14.5,
  },
  cell: {
    borderRadius: 1.5,
    height: 6,
    width: 6,
  },
});
