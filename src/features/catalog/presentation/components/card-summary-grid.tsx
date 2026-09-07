import { Image, useImage } from "expo-image";
import { useState } from "react";
import type { ReactElement } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import type { CardSummary } from "@/features/catalog/card/card-summary";

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
      : (contentWidth - insets.left - insets.right - Spacing.three * 2 - Spacing.two) / 2;

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
          paddingTop: insets.top + Spacing.four,
        },
      ]}
      data={cards}
      keyExtractor={(card) => card.id}
      ListEmptyComponent={<ThemedText themeColor="textSecondary">{emptyMessage}</ThemedText>}
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

function CardGridItem({
  card,
  onPress,
  width,
}: {
  readonly card: CardSummary;
  readonly onPress: (id: string) => void;
  readonly width: number | null;
}) {
  const image = useImage(card.imageUrl, { maxHeight: 720, maxWidth: 512 });

  return (
    <Pressable
      accessibilityLabel={`Open ${card.name}`}
      onPress={() => onPress(card.id)}
      style={[styles.card, width === null ? undefined : { flexBasis: width, flexShrink: 0, width }]}
    >
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

export { CardSummaryGrid };

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
    gap: Spacing.two,
    justifyContent: "center",
    marginBottom: Spacing.two,
  },
  card: {
    flexBasis: "50%",
    flexGrow: 0,
    flexShrink: 1,
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
});
