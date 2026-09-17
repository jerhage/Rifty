import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { match } from "ts-pattern";

import { EmptyState } from "@/components/ui/atoms/empty-state";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import type { DeckSection } from "@/features/deck/deck/deck";
import { useColumnFit, type ColumnSpec } from "@/hooks/use-layout-size";

import { minimumForCard, remainingForCard } from "../../deck-build-allowance";
import { placedCards, quantityOf, type DeckBuildDraft } from "../../deck-build-steps";
import type { SectionPoolLayout, SectionPoolView } from "../../deck-section-pool";
import { BuildCardRow } from "./build-card-row";
import { BuildCardTile } from "./build-card-tile";

const POOL_TILE_COLUMNS: ColumnSpec = {
  gap: Spacing.three,
  minimum: 158,
  sidePadding: Spacing.three,
};
const POOL_ROW_COLUMNS: ColumnSpec = {
  gap: Spacing.two - 1,
  minimum: 300,
  sidePadding: Spacing.three,
};

function SectionPoolList({
  draft,
  onLoadMorePool,
  onOpenCard,
  onSetQuantity,
  poolLayout,
  poolView,
  section,
  sectionPool,
}: {
  readonly draft: DeckBuildDraft;
  readonly onLoadMorePool: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onSetQuantity: (section: DeckSection, card: Card, quantity: number) => void;
  readonly poolLayout: SectionPoolLayout;
  readonly poolView: SectionPoolView;
  readonly section: DeckSection;
  readonly sectionPool: readonly Card[];
}) {
  return match(poolView)
    .with("roles", () => (
      <View style={styles.placeholder}>
        <EmptyState message="Role breakdowns are on the way." />
      </View>
    ))
    .with("pool", () => (
      <CardPlacementList
        cards={sectionPool}
        draft={draft}
        emptyMessage="No cards available for this section yet."
        onLoadMore={onLoadMorePool}
        onOpenCard={onOpenCard}
        onSetQuantity={onSetQuantity}
        poolLayout={poolLayout}
        section={section}
      />
    ))
    .with("inDeck", () => (
      <CardPlacementList
        cards={placedCards(draft, section).map(({ card }) => card)}
        draft={draft}
        emptyMessage="Nothing added to this section yet."
        onLoadMore={undefined}
        onOpenCard={onOpenCard}
        onSetQuantity={onSetQuantity}
        poolLayout={poolLayout}
        section={section}
      />
    ))
    .exhaustive();
}

function CardPlacementList({
  cards,
  draft,
  emptyMessage,
  onLoadMore,
  onOpenCard,
  onSetQuantity,
  poolLayout,
  section,
}: {
  readonly cards: readonly Card[];
  readonly draft: DeckBuildDraft;
  readonly emptyMessage: string;
  readonly onLoadMore: (() => void) | undefined;
  readonly onOpenCard: (card: Card) => void;
  readonly onSetQuantity: (section: DeckSection, card: Card, quantity: number) => void;
  readonly poolLayout: SectionPoolLayout;
  readonly section: DeckSection;
}) {
  const insets = useSafeAreaInsets();
  const isGrid = poolLayout === "grid";
  const spec = isGrid ? POOL_TILE_COLUMNS : POOL_ROW_COLUMNS;
  const { columns, columnWidth } = useColumnFit(spec);

  const wrapperStyle = isGrid ? styles.tileRow : styles.rowRow;

  return (
    <FlatList
      columnWrapperStyle={columns > 1 ? wrapperStyle : undefined}
      contentContainerStyle={[
        styles.pool,
        !isGrid && styles.poolRows,
        {
          paddingLeft: insets.left + spec.sidePadding,
          paddingRight: insets.right + spec.sidePadding,
        },
      ]}
      data={cards}
      key={`${poolLayout}-${columns}`}
      keyExtractor={(card) => card.printingId}
      ListEmptyComponent={<EmptyState message={emptyMessage} />}
      numColumns={columns}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => {
        const placement = {
          allowance: remainingForCard(draft, section, item),
          card: item,
          minQuantity: minimumForCard(draft, section, item),
          onChange: (quantity: number) => onSetQuantity(section, item, quantity),
          onOpenCard,
          quantity: quantityOf(draft, section, item.printingId),
        };

        return isGrid ? (
          <BuildCardTile {...placement} width={columnWidth} />
        ) : (
          <BuildCardRow {...placement} width={columnWidth} />
        );
      }}
      style={styles.poolList}
    />
  );
}

export { POOL_ROW_COLUMNS, POOL_TILE_COLUMNS, SectionPoolList };

const styles = StyleSheet.create({
  poolList: {
    flex: 1,
  },
  pool: {
    paddingBottom: Spacing.four,
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
