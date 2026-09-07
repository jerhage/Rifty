import { StyleSheet } from "react-native";

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
  onSelectCard,
}: CardsDataContent & { readonly onSelectCard: (id: string) => void }) {
  return (
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
  header: {
    gap: Spacing.one,
    paddingBottom: Spacing.three,
  },
});
