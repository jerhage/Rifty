import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";

import { CardSummaryGrid } from "../components/card-summary-grid";
import { CardSummaryPageFooter } from "../components/card-summary-page-footer";
import type { CardsDataContent } from "../data/cards-data";

function CardCatalogScreen({
  cards,
  hasMore,
  isRefreshing,
  isLoadingMore,
  loadMoreError,
  loadMore,
  refresh,
  retryLoadMore,
  filterButtonTop,
  onOpenFilters,
  onSelectCard,
}: CardsDataContent & {
  readonly filterButtonTop: number;
  readonly onOpenFilters: () => void;
  readonly onSelectCard: (id: string) => void;
}) {
  return (
    <View style={styles.screen}>
      <CardSummaryGrid
        cards={cards}
        emptyMessage="No cards are available yet."
        footer={
          <CardSummaryPageFooter
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMore={loadMore}
            loadMoreError={loadMoreError}
            retryLoadMore={retryLoadMore}
          />
        }
        header={<CardCatalogHeader cardCount={cards.length} />}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        onSelectCard={onSelectCard}
      />
      <Pressable
        accessibilityLabel="Open card filters and sorting"
        onPress={onOpenFilters}
        style={({ pressed }) => [styles.filterButton, { top: filterButtonTop }, pressed && styles.pressed]}
      >
        <ThemedView type="backgroundSelected" style={styles.filterButtonSurface}>
          <ThemedText type="smallBold">Filter & Sort</ThemedText>
        </ThemedView>
      </Pressable>
    </View>
  );
}

function CardCatalogHeader({ cardCount }: { readonly cardCount: number }) {
  return (
    <ThemedView style={styles.header}>
      <ThemedText type="subtitle">Riftbound Cards</ThemedText>
      <ThemedText themeColor="textSecondary">Showing {cardCount} cards</ThemedText>
    </ThemedView>
  );
}

export { CardCatalogScreen };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    gap: Spacing.one,
    paddingBottom: Spacing.three,
    paddingRight: 120,
  },
  filterButton: {
    position: "absolute",
    right: Spacing.three,
    zIndex: 1,
  },
  filterButtonSurface: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
