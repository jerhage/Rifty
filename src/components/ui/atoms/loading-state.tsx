import { ActivityIndicator, StyleSheet } from "react-native";

import { ThemedView } from "@/components/ui/atoms/themed-view";

function LoadingState() {
  return (
    <ThemedView style={styles.pane}>
      <ActivityIndicator />
    </ThemedView>
  );
}

export { LoadingState };

const styles = StyleSheet.create({
  pane: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
