import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";

function ErrorState({
  action,
  message,
}: {
  readonly action?: ReactNode;
  readonly message: string;
}) {
  return (
    <ThemedView style={styles.pane}>
      <ThemedText>{message}</ThemedText>
      {action}
    </ThemedView>
  );
}

export { ErrorState };

const styles = StyleSheet.create({
  pane: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.three,
    justifyContent: "center",
  },
});
