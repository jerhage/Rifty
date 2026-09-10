import { ActivityIndicator, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Button } from "@/components/ui/atoms/button";
import { Spacing } from "@/constants/theme";
import type { CardSummariesDataContent } from "@/features/card/presentation/data/card-summaries-data";

function CardSummaryPageFooter({
  isLoadingMore,
  loadMoreError,
  retryLoadMore,
}: Pick<CardSummariesDataContent, "isLoadingMore" | "loadMoreError" | "retryLoadMore">) {
  if (loadMoreError) {
    return (
      <ThemedView style={styles.loadMoreSection}>
        <ThemedText themeColor="textSecondary">{loadMoreError}</ThemedText>
        <Button label="Try again" onPress={retryLoadMore} variant="secondary" />
      </ThemedView>
    );
  }

  if (!isLoadingMore) return null;

  return (
    <ThemedView style={styles.loadMoreSection}>
      <ActivityIndicator />
      <ThemedText themeColor="textSecondary">Loading cards…</ThemedText>
    </ThemedView>
  );
}

export { CardSummaryPageFooter };

const styles = StyleSheet.create({
  loadMoreSection: {
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
});
