import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

import type { CardsDataContent } from "./cards-data";

function CardSummaryPageFooter({
  hasMore,
  isLoadingMore,
  loadMoreError,
  loadMore,
  retryLoadMore,
}: Pick<
  CardsDataContent,
  "hasMore" | "isLoadingMore" | "loadMoreError" | "loadMore" | "retryLoadMore"
>) {
  if (loadMoreError) {
    return (
      <ThemedView style={styles.loadMoreSection}>
        <ThemedText themeColor="textSecondary">{loadMoreError}</ThemedText>
        <LoadMoreButton label="Try loading more" onPress={retryLoadMore} />
      </ThemedView>
    );
  }

  if (!hasMore) return null;

  return (
    <ThemedView style={styles.loadMoreSection}>
      <LoadMoreButton
        disabled={isLoadingMore}
        label={isLoadingMore ? "Loading cards…" : "Load more cards"}
        onPress={loadMore}
      />
    </ThemedView>
  );
}

function LoadMoreButton({
  disabled = false,
  label,
  onPress,
}: {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundSelected" style={[styles.loadMoreButton, disabled && styles.disabled]}>
        <ThemedText type="smallBold">{label}</ThemedText>
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
  loadMoreButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
