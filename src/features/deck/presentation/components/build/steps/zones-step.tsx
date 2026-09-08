import { useState } from "react";
import { FlatList, StyleSheet, TextInput, View, type LayoutChangeEvent } from "react-native";

import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/catalog/card/card";
import type { DeckSection, DeckVerification } from "@/features/deck/deck/deck";
import { useTheme } from "@/hooks/use-theme";

import { displayedCopies, remainingForCard } from "../../../deck-build-allowance";
import {
  placedCardTotal,
  placedCards,
  quantityOf,
  zoneCounts,
  type DeckBuildDraft,
} from "../../../deck-build-steps";
import {
  activePoolFilterCount,
  searchHint,
  zoneRuleSummary,
  type ZonePoolFilters,
  type ZonePoolLayout,
  type ZonePoolView,
} from "../../../deck-zone-pool";
import { BuildCardRow } from "../build-card-row";
import { BuildCardTile } from "../build-card-tile";
import { BuildFooter } from "../build-footer";
import { BuildPickChip } from "../build-pick-chip";
import { PoolLayoutToggle } from "../pool-layout-toggle";
import { PoolSearchRow } from "../pool-search-row";
import { PoolViewPlaceholder } from "../pool-view-placeholder";
import { PoolViewTabs } from "../pool-view-tabs";
import { ZoneSelector } from "../zone-selector";

interface ZonesStepProps {
  readonly draft: DeckBuildDraft;
  readonly error: string | null;
  readonly isSaving: boolean;
  readonly onChangeName: (name: string) => void;
  readonly onChangePoolQuery: (query: string) => void;
  readonly onEditStep: (index: number) => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onLoadMorePool: () => void;
  readonly onOpenPoolFilters: () => void;
  readonly onSave: () => void;
  readonly onSelectPoolLayout: (layout: ZonePoolLayout) => void;
  readonly onSelectPoolView: (view: ZonePoolView) => void;
  readonly onSelectZone: (section: DeckSection) => void;
  readonly onSetQuantity: (section: DeckSection, card: Card, quantity: number) => void;
  readonly poolFilters: ZonePoolFilters;
  readonly poolLayout: ZonePoolLayout;
  readonly poolView: ZonePoolView;
  readonly verification: DeckVerification;
  readonly zone: DeckSection;
  readonly zonePool: readonly Card[];
}

function ZonesStep({
  draft,
  error,
  isSaving,
  onChangeName,
  onChangePoolQuery,
  onEditStep,
  onLoadMorePool,
  onOpenCard,
  onSave,
  onOpenPoolFilters,
  onSelectPoolLayout,
  onSelectPoolView,
  onSelectZone,
  onSetQuantity,
  poolFilters,
  poolLayout,
  poolView,
  verification,
  zone,
  zonePool,
}: ZonesStepProps) {
  const theme = useTheme();
  const [poolWidth, setPoolWidth] = useState<number | null>(null);
  const tileWidth = poolWidth === null ? null : (poolWidth - Spacing.three * 2 - Spacing.three) / 2;

  const measurePool = ({ nativeEvent }: LayoutChangeEvent) => {
    const width = nativeEvent.layout.width;
    setPoolWidth((current) => (current === width ? current : width));
  };

  const isPool = poolView === "pool";
  const placed = placedCards(draft, zone);
  const listed = isPool ? zonePool : placed.map((entry) => entry.card);

  return (
    <>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <TextInput
            accessibilityLabel="Deck name"
            autoCapitalize="words"
            onChangeText={onChangeName}
            placeholder="Deck name"
            placeholderTextColor={theme.textTertiary}
            style={[styles.nameInput, { color: theme.text }]}
            value={draft.name}
          />
          <ThemedText
            style={{ color: verification.type === "legal" ? theme.positive : theme.warning }}
            type="mono"
          >
            {verification.type === "legal" ? "Legal" : "Incomplete"}
          </ThemedText>
        </View>

        <View style={styles.chips}>
          <BuildPickChip card={draft.legend} label="Legend" onEdit={() => onEditStep(0)} />
          <BuildPickChip
            card={draft.chosenChampion}
            label="Champion"
            onEdit={() => onEditStep(1)}
          />
        </View>

        <View style={styles.zones}>
          <ZoneSelector counts={zoneCounts(draft)} onSelect={onSelectZone} selected={zone} />
        </View>

        <View style={styles.viewRow}>
          <View style={styles.tabs}>
            <PoolViewTabs
              deckCount={placedCardTotal(placed)}
              onSelect={onSelectPoolView}
              view={poolView}
            />
          </View>
          <PoolLayoutToggle layout={poolLayout} onSelect={onSelectPoolLayout} />
        </View>

        <ThemedText numberOfLines={1} themeColor="textTertiary" type="mono" style={styles.rule}>
          {zoneRuleSummary(zone)}
        </ThemedText>

        {isPool ? (
          <PoolSearchRow
            filterCount={activePoolFilterCount(poolFilters)}
            hint={searchHint(zone)}
            onChangeQuery={onChangePoolQuery}
            onOpenFilters={onOpenPoolFilters}
            query={poolFilters.query}
          />
        ) : null}
      </View>

      {match(poolView)
        .with("roles", () => <PoolViewPlaceholder message="Role breakdowns are on the way." />)
        .with("pool", "inDeck", () => (
          <FlatList
            columnWrapperStyle={poolLayout === "grid" ? styles.tileRow : undefined}
            contentContainerStyle={[styles.pool, poolLayout === "list" && styles.poolRows]}
            data={listed}
            key={poolLayout}
            keyExtractor={(card) => card.id}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary" type="body" style={styles.empty}>
                {isPool
                  ? "No cards available for this zone yet."
                  : "Nothing added to this zone yet."}
              </ThemedText>
            }
            numColumns={poolLayout === "grid" ? 2 : 1}
            onEndReached={isPool ? onLoadMorePool : undefined}
            onEndReachedThreshold={0.5}
            onLayout={measurePool}
            renderItem={({ item }) => {
              const placement = {
                card: item,
                displayedQuantity: displayedCopies(draft, zone, item),
                maxQuantity: remainingForCard(draft, zone, item),
                onChange: (quantity: number) => onSetQuantity(zone, item, quantity),
                onOpenCard,
                quantity: quantityOf(draft, zone, item.riftboundId),
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
        .exhaustive()}

      <BuildFooter actionLabel={isSaving ? "Saving…" : "Save deck"} onAction={onSave}>
        {error === null ? (
          <ThemedText numberOfLines={1} themeColor="textSecondary" type="mono">
            {verification.type === "illegal"
              ? `${verification.violations.length} to fix`
              : "Ready to save"}
          </ThemedText>
        ) : (
          <ThemedText numberOfLines={2} themeColor="negative" type="body">
            {error}
          </ThemedText>
        )}
      </BuildFooter>
    </>
  );
}

export { ZonesStep };
export type { ZonesStepProps };

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.three,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two + 2,
  },
  nameInput: {
    flex: 1,
    fontSize: 21,
    fontWeight: 700,
    letterSpacing: -0.4,
    minWidth: 0,
    padding: 0,
  },
  chips: {
    flexDirection: "row",
    gap: Spacing.two - 1,
    marginTop: Spacing.two + 1,
  },
  zones: {
    marginTop: Spacing.three - 5,
  },
  viewRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two - 1,
    marginTop: Spacing.two + 1,
  },
  tabs: {
    flex: 1,
    minWidth: 0,
  },
  rule: {
    marginTop: Spacing.two + 1,
  },
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
