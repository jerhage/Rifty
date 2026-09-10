import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Button } from "@/components/ui/atoms/button";
import { Spacing } from "@/constants/theme";
import type { CardSummariesDataContent } from "@/features/card/presentation/data/card-summaries-data";

function CardSummaryPageFooter({
  paging,
  retryLoadMore,
}: Pick<CardSummariesDataContent, "paging" | "retryLoadMore">) {
  return match(paging)
    .with({ type: "idle" }, () => null)
    .with({ type: "loadingMore" }, () => (
      <ThemedView style={styles.loadMoreSection}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Loading cards…</ThemedText>
      </ThemedView>
    ))
    .with({ type: "failed" }, ({ message }) => (
      <ThemedView style={styles.loadMoreSection}>
        <ThemedText themeColor="textSecondary">{message}</ThemedText>
        <Button label="Try again" onPress={retryLoadMore} variant="secondary" />
      </ThemedView>
    ))
    .exhaustive();
}

export { CardSummaryPageFooter };

const styles = StyleSheet.create({
  loadMoreSection: {
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
});
