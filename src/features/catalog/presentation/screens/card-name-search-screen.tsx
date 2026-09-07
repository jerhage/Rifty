import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { CardSummaryGrid } from "../components/card-summary-grid";
import { CardSummaryPageFooter } from "../components/card-summary-page-footer";
import type { CardsDataContent } from "../data/cards-data";

interface CardNameSearchScreenProps extends CardsDataContent {
  readonly filterButtonTop: number;
  readonly name: string;
  readonly onChangeName: (name: string) => void;
  readonly onOpenFilters: () => void;
  readonly onSelectCard: (id: string) => void;
}

function CardNameSearchScreen({
  cards,
  filterButtonTop,
  isLoadingMore,
  isRefreshing,
  loadMore,
  loadMoreError,
  name,
  onChangeName,
  onOpenFilters,
  onSelectCard,
  refresh,
  retryLoadMore,
}: CardNameSearchScreenProps) {
  return (
    <View style={styles.screen}>
      <CardSummaryGrid
        cards={cards}
        emptyMessage={name.trim() ? "No cards match that search." : "No cards are available yet."}
        footer={
          <CardSummaryPageFooter
            isLoadingMore={isLoadingMore}
            loadMoreError={loadMoreError}
            retryLoadMore={retryLoadMore}
          />
        }
        header={
          <CardNameSearchHeader name={name} onChangeName={onChangeName} resultCount={cards.length} />
        }
        isRefreshing={isRefreshing}
        onEndReached={loadMore}
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

function CardNameSearchHeader({
  name,
  onChangeName,
  resultCount,
}: {
  readonly name: string;
  readonly onChangeName: (name: string) => void;
  readonly resultCount: number;
}) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.header}>
      <ThemedText type="subtitle">Search Cards</ThemedText>
      <TextInput
        accessibilityLabel="Search cards by name or rules text"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeName}
        placeholder="Card name or rules text"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        value={name}
      />
      {name.trim() ? (
        <ThemedText themeColor="textSecondary">
          {resultCount === 1 ? "1 card" : `${resultCount} cards`}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

export { CardNameSearchScreen };

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
    paddingBottom: Spacing.three,
    paddingRight: 120,
  },
  screen: {
    flex: 1,
  },
  input: {
    borderRadius: Spacing.two,
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
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
