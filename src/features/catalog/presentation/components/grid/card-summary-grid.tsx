import type { ReactElement } from "react";
import { FlatList, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/atoms/empty-state";
import { Spacing } from "@/constants/theme";
import type { CardSummary } from "@/features/card/card-summary";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import { fitColumns, useLayoutSize, type ColumnSpec } from "@/hooks/use-layout-size";

import { CardGridItem } from "./card-grid-item";

interface CardSummaryGridProps {
  readonly cards: readonly CardSummary[];
  readonly emptyMessage: string;
  readonly footer?: ReactElement | null;
  readonly header: ReactElement;
  readonly isRefreshing: boolean;
  readonly onEndReached: () => void;
  readonly onRefresh: () => void;
  readonly onSelectCard: (id: PrintingId) => void;
}

const CATALOG_COLUMNS: ColumnSpec = { gap: Spacing.three, minimum: 150 };

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
  const { width } = useLayoutSize();
  const { columns, columnWidth } = fitColumns(
    width - insets.left - insets.right - Spacing.three * 2,
    CATALOG_COLUMNS,
  );

  return (
    <FlatList
      columnWrapperStyle={columns > 1 && cards.length > 0 ? styles.cardRow : undefined}
      contentContainerStyle={{
        paddingBottom: insets.bottom + Spacing.four,
        paddingLeft: insets.left + Spacing.three,
        paddingRight: insets.right + Spacing.three,
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
        <CardGridItem card={item} onPress={onSelectCard} width={columnWidth} />
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
