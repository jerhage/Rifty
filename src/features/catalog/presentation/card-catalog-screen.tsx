import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CardSummaryCard } from "@/components/ui/card-summary-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";

import type { CardsDataContent } from "./cards-data";

function CardCatalogScreen({
  cards,
  hasMore,
  isRefreshing,
  isLoadingMore,
  loadMoreError,
  loadMore,
  refresh,
  retryLoadMore,
}: CardsDataContent) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      style={styles.scrollView}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          paddingLeft: insets.left + Spacing.three,
          paddingRight: insets.right + Spacing.three,
          paddingTop: insets.top + Spacing.four,
        },
      ]}
    >
      {isRefreshing && <ActivityIndicator />}
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Riftbound Cards</ThemedText>
          <ThemedText themeColor="textSecondary">
            {cards.length === 0 ? "No cards are available yet." : `Showing ${cards.length} cards`}
          </ThemedText>
        </ThemedView>

        {cards.map((card) => (
          <CardSummaryCard key={card.id} card={card} />
        ))}

        {loadMoreError ? (
          <ThemedView style={styles.loadMoreSection}>
            <ThemedText themeColor="textSecondary">{loadMoreError}</ThemedText>
            <LoadMoreButton label="Try loading more" onPress={retryLoadMore} />
          </ThemedView>
        ) : null}

        {hasMore && !loadMoreError ? (
          <ThemedView style={styles.loadMoreSection}>
            <LoadMoreButton
              disabled={isLoadingMore}
              label={isLoadingMore ? "Loading cards…" : "Load more cards"}
              onPress={loadMore}
            />
          </ThemedView>
        ) : null}
      </ThemedView>
    </ScrollView>
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
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <ThemedView
        type="backgroundSelected"
        style={[styles.loadMoreButton, disabled && styles.disabled]}
      >
        <ThemedText type="smallBold">{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export { CardCatalogScreen };

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: "center",
  },
  container: {
    flexGrow: 1,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: "100%",
  },
  header: {
    gap: Spacing.one,
    paddingBottom: Spacing.two,
  },
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
