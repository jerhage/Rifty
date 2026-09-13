import type { ReactElement } from "react";
import { FlatList, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/atoms/empty-state";
import { Spacing } from "@/constants/theme";
import type { CardSummary } from "@/features/card/card-summary";
import { useColumnFit, type ColumnSpec } from "@/hooks/use-layout-size";

import { CardGridItem } from "./card-grid-item";

interface CardSummaryGridProps {
  readonly cards: readonly CardSummary[];
  readonly emptyMessage: string;
  readonly footer?: ReactElement | null;
  readonly header: ReactElement;
  readonly isRefreshing: boolean;
  readonly onEndReached: () => void;
  readonly onOpenCard: (card: CardSummary) => void;
  readonly onRefresh: () => void;
}

const CATALOG_COLUMNS: ColumnSpec = {
  gap: Spacing.three,
  minimum: 150,
  sidePadding: Spacing.three,
};

function CardSummaryGrid({
  cards,
  emptyMessage,
  footer,
  header,
  isRefreshing,
  onEndReached,
  onOpenCard,
  onRefresh,
}: CardSummaryGridProps) {
  const insets = useSafeAreaInsets();
  const { columns, columnWidth } = useColumnFit(CATALOG_COLUMNS);

  return (
    <FlatList
      columnWrapperStyle={columns > 1 && cards.length > 0 ? styles.cardRow : undefined}
      contentContainerStyle={{
        paddingBottom: insets.bottom + Spacing.four,
        paddingLeft: insets.left + CATALOG_COLUMNS.sidePadding,
        paddingRight: insets.right + CATALOG_COLUMNS.sidePadding,
        paddingTop: Spacing.three,
      }}
      data={cards}
      key={columns}
      keyExtractor={(card) => card.printingId}
      ListEmptyComponent={<EmptyState message={emptyMessage} />}
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      numColumns={columns}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <CardGridItem card={item} onPress={onOpenCard} width={columnWidth} />
      )}
      style={styles.list}
    />
  );
}

export { CATALOG_COLUMNS, CardSummaryGrid };
export type { CardSummaryGridProps };

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  cardRow: {
    gap: Spacing.three,
    justifyContent: "center",
  },
});
