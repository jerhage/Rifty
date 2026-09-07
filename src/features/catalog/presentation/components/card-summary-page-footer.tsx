import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";

import type { CardsDataContent } from "../data/cards-data";

function CardSummaryPageFooter({
  isLoadingMore,
  loadMoreError,
  retryLoadMore,
}: Pick<
  CardsDataContent,
  "isLoadingMore" | "loadMoreError" | "retryLoadMore"
>) {
  if (loadMoreError) {
    return (
      <ThemedView style={styles.loadMoreSection}>
        <ThemedText themeColor="textSecondary">{loadMoreError}</ThemedText>
        <RetryButton onPress={retryLoadMore} />
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

function RetryButton({ onPress }: { readonly onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundSelected" style={styles.retryButton}>
        <ThemedText type="smallBold">Try again</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export { CardSummaryPageFooter };

const styles = StyleSheet.create({
  loadMoreSection: {
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  retryButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
});
