import { Image, useImage } from "expo-image";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import type { CardSummary } from "@/features/catalog/card/card-summary";

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
  onSelectCard,
}: CardsDataContent & { readonly onSelectCard: (id: string) => void }) {
  const insets = useSafeAreaInsets();

  return (
    <FlatList
      columnWrapperStyle={cards.length > 0 ? styles.cardRow : undefined}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          paddingLeft: insets.left + Spacing.three,
          paddingRight: insets.right + Spacing.three,
          paddingTop: insets.top + Spacing.four,
        },
      ]}
      data={cards}
      keyExtractor={(card) => card.id}
      ListEmptyComponent={
        <ThemedText themeColor="textSecondary">No cards are available yet.</ThemedText>
      }
      ListFooterComponent={
        <CardCatalogFooter
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          loadMoreError={loadMoreError}
          loadMore={loadMore}
          retryLoadMore={retryLoadMore}
        />
      }
      ListHeaderComponent={<CardCatalogHeader cardCount={cards.length} />}
      numColumns={2}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      renderItem={({ item }) => <CardGridItem card={item} onPress={onSelectCard} />}
      style={styles.list}
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

function CardCatalogFooter({
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

function CardGridItem({
  card,
  onPress,
}: {
  readonly card: CardSummary;
  readonly onPress: (id: string) => void;
}) {
  const image = useImage(card.imageUrl, { maxHeight: 720, maxWidth: 512 });

  return (
    <Pressable accessibilityLabel={`Open ${card.name}`} onPress={() => onPress(card.id)} style={styles.card}>
      {image ? (
        <Image
          contentFit="contain"
          source={image}
          style={[styles.image, { aspectRatio: image.width / image.height }]}
          transition={150}
        />
      ) : (
        <ThemedView type="backgroundElement" style={styles.imagePlaceholder}>
          <ActivityIndicator />
        </ThemedView>
      )}
    </Pressable>
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
  list: {
    flex: 1,
  },
  content: {
    alignSelf: "center",
    maxWidth: MaxContentWidth,
    width: "100%",
  },
  header: {
    gap: Spacing.one,
    paddingBottom: Spacing.three,
  },
  cardRow: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  card: {
    flex: 1,
    overflow: "hidden",
  },
  image: {
    width: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
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
