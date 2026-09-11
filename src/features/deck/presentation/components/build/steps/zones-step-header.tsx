import { StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import {
  placedCardTotal,
  placedCards,
  zoneCounts,
  type DeckBuildStepId,
} from "../../../deck-build-steps";
import { completenessLabel, legalityColor } from "../../../deck-legality-format";
import { activePoolFilterCount, searchHint, zoneRuleSummary } from "../../../deck-zone-pool";
import type { ZoneDraftViewState, ZonePoolViewState } from "../../../hooks/use-deck-build";
import { BuildPickChip } from "../build-pick-chip";
import { PoolLayoutToggle } from "../pool-layout-toggle";
import { PoolSearchRow } from "../pool-search-row";
import { PoolViewTabs } from "../pool-view-tabs";
import { ZoneSelector } from "../zone-selector";

function ZonesStepHeader({
  draft: { draft, verification },
  onChangeName,
  onEditStep,
  pool: { filters, layout, openFilters, query, setLayout, setQuery, setView, setZone, view, zone },
}: {
  readonly draft: ZoneDraftViewState;
  readonly onChangeName: (name: string) => void;
  readonly onEditStep: (id: DeckBuildStepId) => void;
  readonly pool: ZonePoolViewState;
}) {
  const theme = useTheme();
  const isPool = view === "pool";
  const placed = placedCards(draft, zone);

  return (
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
        <ThemedText style={{ color: legalityColor(verification, theme) }} type="mono">
          {completenessLabel(verification)}
        </ThemedText>
      </View>

      <View style={styles.chips}>
        <BuildPickChip card={draft.legend} label="Legend" onEdit={() => onEditStep("legend")} />
        <BuildPickChip
          card={draft.chosenChampion}
          label="Champion"
          onEdit={() => onEditStep("chosenChampion")}
        />
      </View>

      <View style={styles.zones}>
        <ZoneSelector counts={zoneCounts(draft)} onSelect={setZone} selected={zone} />
      </View>

      <View style={styles.viewRow}>
        <View style={styles.tabs}>
          <PoolViewTabs deckCount={placedCardTotal(placed)} onSelect={setView} view={view} />
        </View>
        <PoolLayoutToggle layout={layout} onSelect={setLayout} />
      </View>

      <ThemedText numberOfLines={1} themeColor="textTertiary" type="mono" style={styles.rule}>
        {zoneRuleSummary(zone)}
      </ThemedText>

      {isPool ? (
        <PoolSearchRow
          filterCount={activePoolFilterCount(filters)}
          hint={searchHint(zone)}
          onChangeQuery={setQuery}
          onOpenFilters={openFilters}
          query={query}
        />
      ) : null}
    </View>
  );
}

export { ZonesStepHeader };

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
});
