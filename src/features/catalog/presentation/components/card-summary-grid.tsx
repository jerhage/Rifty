import { Image, useImage } from "expo-image";
import type { ReactElement } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import type { CardSummary } from "@/features/catalog/card/card-summary";

interface CardSummaryGridProps {
  readonly cards: readonly CardSummary[];
  readonly emptyMessage: string;
  readonly footer?: ReactElement | null;
  readonly header: ReactElement;
  readonly isRefreshing: boolean;
  readonly onRefresh: () => void;
  readonly onSelectCard: (id: string) => void;
}

function CardSummaryGrid({
  cards,
  emptyMessage,
  footer,
  header,
  isRefreshing,
  onRefresh,
  onSelectCard,
}: CardSummaryGridProps) {
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
      ListEmptyComponent={<ThemedText themeColor="textSecondary">{emptyMessage}</ThemedText>}
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      numColumns={2}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => <CardGridItem card={item} onPress={onSelectCard} />}
      style={styles.list}
    />
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
});
