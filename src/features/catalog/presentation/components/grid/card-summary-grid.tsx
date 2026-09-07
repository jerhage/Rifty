import { useState } from "react";
import type { ReactElement } from "react";
import { FlatList, RefreshControl, StyleSheet, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import type { CardSummary } from "@/features/catalog/card/card-summary";

import { CardGridItem } from "./card-grid-item";

interface CardSummaryGridProps {
  readonly cards: readonly CardSummary[];
  readonly emptyMessage: string;
  readonly footer?: ReactElement | null;
  readonly header: ReactElement;
  readonly isRefreshing: boolean;
  readonly onEndReached: () => void;
  readonly onRefresh: () => void;
  readonly onSelectCard: (id: string) => void;
}

/** The two-column catalog grid. Tiles are measured so a trailing odd card keeps its column width. */
function CardSummaryGrid({
  cards,
  emptyMessage,
  footer,
  header,
  isRefreshing,
  onEndReached,
  onRefresh,
  onSelectCard,
}: CardSummaryGridProps) {
  const insets = useSafeAreaInsets();
  const [listWidth, setListWidth] = useState<number | null>(null);
  const contentWidth = listWidth === null ? null : Math.min(listWidth, MaxContentWidth);
  const cardWidth =
    contentWidth === null
      ? null
      : (contentWidth - insets.left - insets.right - Spacing.three * 2 - Spacing.three) / 2;

  const updateListWidth = ({ nativeEvent }: LayoutChangeEvent) => {
    const width = nativeEvent.layout.width;
    setListWidth((currentWidth) => (currentWidth === width ? currentWidth : width));
  };

  return (
    <FlatList
      columnWrapperStyle={cards.length > 0 ? styles.cardRow : undefined}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + Spacing.four,
          paddingLeft: insets.left + Spacing.three,
          paddingRight: insets.right + Spacing.three,
          paddingTop: Spacing.three,
        },
      ]}
      data={cards}
      keyExtractor={(card) => card.id}
      ListEmptyComponent={
        <ThemedText themeColor="textSecondary" type="body" style={styles.empty}>
          {emptyMessage}
        </ThemedText>
      }
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      numColumns={2}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onLayout={updateListWidth}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <CardGridItem card={item} onPress={onSelectCard} width={cardWidth} />
      )}
      style={styles.list}
    />
  );
}

export { CardSummaryGrid };
export type { CardSummaryGridProps };

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    alignSelf: "center",
    maxWidth: MaxContentWidth,
    width: "100%",
  },
  cardRow: {
    gap: Spacing.three,
    justifyContent: "center",
    marginBottom: Spacing.three,
  },
  empty: {
    paddingVertical: Spacing.six,
    textAlign: "center",
  },
});
