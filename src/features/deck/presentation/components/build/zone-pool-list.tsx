import { useState } from "react";
import { FlatList, StyleSheet, type LayoutChangeEvent } from "react-native";

import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import type { DeckSection } from "@/features/deck/deck/deck";

import { minimumForCard, remainingForCard } from "../../deck-build-allowance";
import { placedCards, quantityOf, type DeckBuildDraft } from "../../deck-build-steps";
import type { ZonePoolLayout, ZonePoolView } from "../../deck-zone-pool";
import { BuildCardRow } from "./build-card-row";
import { BuildCardTile } from "./build-card-tile";
import { PoolViewPlaceholder } from "./pool-view-placeholder";

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
  readonly onSetQuantity: (section: DeckSection, card: Card, quantity: number) => void;
  readonly poolLayout: ZonePoolLayout;
  readonly poolView: ZonePoolView;
  readonly zone: DeckSection;
  readonly zonePool: readonly Card[];
}) {
  const [poolWidth, setPoolWidth] = useState<number | null>(null);
  const tileWidth = poolWidth === null ? null : (poolWidth - Spacing.three * 2 - Spacing.three) / 2;

  const measurePool = ({ nativeEvent }: LayoutChangeEvent) => {
    const width = nativeEvent.layout.width;
    setPoolWidth((current) => (current === width ? current : width));
  };

  const isPool = poolView === "pool";
  const placed = placedCards(draft, zone);
  const listed = isPool ? zonePool : placed.map((entry) => entry.card);

  return match(poolView)
    .with("roles", () => <PoolViewPlaceholder message="Role breakdowns are on the way." />)
    .with("pool", "inDeck", () => (
      <FlatList
        columnWrapperStyle={poolLayout === "grid" ? styles.tileRow : undefined}
        contentContainerStyle={[styles.pool, poolLayout === "list" && styles.poolRows]}
        data={listed}
        key={poolLayout}
        keyExtractor={(card) => card.printingId}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" type="body" style={styles.empty}>
            {isPool ? "No cards available for this zone yet." : "Nothing added to this zone yet."}
          </ThemedText>
        }
        numColumns={poolLayout === "grid" ? 2 : 1}
        onEndReached={isPool ? onLoadMorePool : undefined}
        onEndReachedThreshold={0.5}
        onLayout={measurePool}
        renderItem={({ item }) => {
          const placement = {
            card: item,
            maxQuantity: remainingForCard(draft, zone, item),
            minQuantity: minimumForCard(draft, zone, item),
            onChange: (quantity: number) => onSetQuantity(zone, item, quantity),
            onOpenCard,
            quantity: quantityOf(draft, zone, item.printingId),
          };

          return poolLayout === "grid" ? (
            <BuildCardTile {...placement} width={tileWidth} />
          ) : (
            <BuildCardRow {...placement} />
          );
        }}
        style={styles.poolList}
      />
    ))
    .exhaustive();
}

export { ZonePoolList };

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
    marginBottom: Spacing.three,
  },
  empty: {
    paddingVertical: Spacing.six,
    textAlign: "center",
  },
});
