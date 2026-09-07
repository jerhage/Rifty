import { ActivityIndicator, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { SecondaryButton } from "@/components/ui/atoms/secondary-button";
import { Spacing } from "@/constants/theme";

import type { CardsDataContent } from "../../data/cards-data";

function CardSummaryPageFooter({
  isLoadingMore,
  loadMoreError,
  retryLoadMore,
}: Pick<CardsDataContent, "isLoadingMore" | "loadMoreError" | "retryLoadMore">) {
  if (loadMoreError) {
    return (
      <ThemedView style={styles.loadMoreSection}>
        <ThemedText themeColor="textSecondary">{loadMoreError}</ThemedText>
        <SecondaryButton label="Try again" onPress={retryLoadMore} />
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
