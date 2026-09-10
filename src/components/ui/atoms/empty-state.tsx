import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";

function EmptyState({ message }: { readonly message: string }) {
  return (
    <ThemedText themeColor="textSecondary" type="body" style={styles.message}>
      {message}
    </ThemedText>
  );
}

export { EmptyState };

const styles = StyleSheet.create({
  message: {
    paddingVertical: Spacing.six,
    textAlign: "center",
  },
});
