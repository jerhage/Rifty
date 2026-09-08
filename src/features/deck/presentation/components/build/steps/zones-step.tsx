import { ScrollView, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/catalog/card/card";
import type { DeckSection, DeckVerification } from "@/features/deck/deck/deck";
import { useTheme } from "@/hooks/use-theme";

import { displayedCopies, remainingForCard } from "../../../deck-build-allowance";
import { quantityOf, zoneCounts, type DeckBuildDraft } from "../../../deck-build-steps";
import {
  activePoolFilterCount,
  searchHint,
  zoneRuleSummary,
  type ZonePoolFilters,
} from "../../../deck-zone-pool";
import { BuildCardRow } from "../build-card-row";
import { BuildFooter } from "../build-footer";
import { BuildPickChip } from "../build-pick-chip";
import { PoolSearchRow } from "../pool-search-row";
import { ZoneSelector } from "../zone-selector";

interface ZonesStepProps {
  readonly draft: DeckBuildDraft;
  readonly error: string | null;
  readonly isSaving: boolean;
  readonly onChangeName: (name: string) => void;
  readonly onChangePoolQuery: (query: string) => void;
  readonly onEditStep: (index: number) => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onOpenPoolFilters: () => void;
  readonly onSave: () => void;
  readonly onSelectZone: (section: DeckSection) => void;
  readonly onSetQuantity: (section: DeckSection, card: Card, quantity: number) => void;
  readonly poolFilters: ZonePoolFilters;
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
  onOpenCard,
  onOpenPoolFilters,
  onSave,
  onSelectZone,
  onSetQuantity,
  poolFilters,
  verification,
  zone,
  zonePool,
}: ZonesStepProps) {
  const theme = useTheme();

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

        <ThemedText numberOfLines={1} themeColor="textTertiary" type="mono" style={styles.rule}>
          {zoneRuleSummary(zone)}
        </ThemedText>

        <PoolSearchRow
          filterCount={activePoolFilterCount(poolFilters)}
          hint={searchHint(zone)}
          onChangeQuery={onChangePoolQuery}
          onOpenFilters={onOpenPoolFilters}
          query={poolFilters.query}
        />
      </View>

      <ScrollView contentContainerStyle={styles.pool}>
        {zonePool.map((card) => (
          <BuildCardRow
            card={card}
            displayedQuantity={displayedCopies(draft, zone, card)}
            key={card.id}
            maxQuantity={remainingForCard(draft, zone, card)}
            onChange={(quantity) => onSetQuantity(zone, card, quantity)}
            onOpenCard={onOpenCard}
            quantity={quantityOf(draft, zone, card.riftboundId)}
          />
        ))}
        {zonePool.length === 0 ? (
          <ThemedText themeColor="textSecondary" type="body" style={styles.empty}>
            No cards available for this zone yet.
          </ThemedText>
        ) : null}
      </ScrollView>

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
  rule: {
    marginTop: Spacing.two + 1,
  },
  pool: {
    gap: Spacing.two - 1,
    paddingBottom: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three - 4,
  },
  empty: {
    paddingVertical: Spacing.six,
    textAlign: "center",
  },
});
