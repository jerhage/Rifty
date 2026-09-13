import { FlatList, StyleSheet, View } from "react-native";

import { match } from "ts-pattern";

import { EmptyState } from "@/components/ui/atoms/empty-state";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import type { ZoneSection } from "@/features/deck/deck/deck-legality";
import { fitColumns, useLayoutSize, type ColumnSpec } from "@/hooks/use-layout-size";

import { minimumForCard, remainingForCard } from "../../deck-build-allowance";
import { placedCards, quantityOf, type DeckBuildDraft } from "../../deck-build-steps";
import type { ZonePoolLayout, ZonePoolView } from "../../deck-zone-pool";
import { BuildCardRow } from "./build-card-row";
import { BuildCardTile } from "./build-card-tile";

const POOL_TILE_COLUMNS: ColumnSpec = { gap: Spacing.three, minimum: 158 };
const POOL_ROW_COLUMNS: ColumnSpec = { gap: Spacing.two - 1, minimum: 300 };

function ZonePoolList({
  draft,
  onLoadMorePool,
  onOpenCard,
  onSetQuantity,
  poolLayout,
  poolView,
  zone,
  zonePool,
}: {
  readonly draft: DeckBuildDraft;
  readonly onLoadMorePool: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onSetQuantity: (section: ZoneSection, card: Card, quantity: number) => void;
  readonly poolLayout: ZonePoolLayout;
  readonly poolView: ZonePoolView;
  readonly zone: ZoneSection;
  readonly zonePool: readonly Card[];
}) {
  const { width } = useLayoutSize();
  const isGrid = poolLayout === "grid";
  const { columns, columnWidth } = fitColumns(
    width - Spacing.three * 2,
    isGrid ? POOL_TILE_COLUMNS : POOL_ROW_COLUMNS,
  );

  const wrapperStyle = isGrid ? styles.tileRow : styles.rowRow;

  const isPool = poolView === "pool";
  const placed = placedCards(draft, zone);
  const listed = isPool ? zonePool : placed.map((entry) => entry.card);

  return match(poolView)
    .with("roles", () => (
      <View style={styles.placeholder}>
        <EmptyState message="Role breakdowns are on the way." />
      </View>
    ))
    .with("pool", "inDeck", () => (
      <FlatList
        columnWrapperStyle={columns > 1 ? wrapperStyle : undefined}
        contentContainerStyle={[styles.pool, !isGrid && styles.poolRows]}
        data={listed}
        key={`${poolLayout}-${columns}`}
        keyExtractor={(card) => card.printingId}
        ListEmptyComponent={
          <EmptyState
            message={
              isPool ? "No cards available for this zone yet." : "Nothing added to this zone yet."
            }
          />
        }
        numColumns={columns}
        onEndReached={isPool ? onLoadMorePool : undefined}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => {
          const placement = {
            allowance: remainingForCard(draft, zone, item),
            card: item,
            minQuantity: minimumForCard(draft, zone, item),
            onChange: (quantity: number) => onSetQuantity(zone, item, quantity),
            onOpenCard,
            quantity: quantityOf(draft, zone, item.printingId),
          };

          return isGrid ? (
            <BuildCardTile {...placement} width={columnWidth} />
          ) : (
            <BuildCardRow {...placement} width={columnWidth} />
          );
        }}
        style={styles.poolList}
      />
    ))
    .exhaustive();
}

export { POOL_ROW_COLUMNS, POOL_TILE_COLUMNS, ZonePoolList };

const styles = StyleSheet.create({
  poolList: {
    flex: 1,
  },
  pool: {
    paddingBottom: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three - 4,
  },
  poolRows: {
    gap: Spacing.two - 1,
  },
  tileRow: {
    gap: Spacing.three,
    justifyContent: "center",
  },
  rowRow: {
    gap: Spacing.two - 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
  },
});
