import { StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { DeckSection, DeckVerification } from "@/features/deck/deck/deck";
import { useTheme } from "@/hooks/use-theme";

import {
  placedCardTotal,
  placedCards,
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
import { BuildPickChip } from "../build-pick-chip";
import { PoolLayoutToggle } from "../pool-layout-toggle";
import { PoolSearchRow } from "../pool-search-row";
import { PoolViewTabs } from "../pool-view-tabs";
import { ZoneSelector } from "../zone-selector";

function ZonesStepHeader({
  draft,
  onChangeName,
  onChangePoolQuery,
  onEditStep,
  onOpenPoolFilters,
  onSelectPoolLayout,
  onSelectPoolView,
  onSelectZone,
  poolFilters,
  poolLayout,
  poolQuery,
  poolView,
  verification,
  zone,
}: {
  readonly draft: DeckBuildDraft;
  readonly onChangeName: (name: string) => void;
  readonly onChangePoolQuery: (query: string) => void;
  readonly onEditStep: (index: number) => void;
  readonly onOpenPoolFilters: () => void;
  readonly onSelectPoolLayout: (layout: ZonePoolLayout) => void;
  readonly onSelectPoolView: (view: ZonePoolView) => void;
  readonly onSelectZone: (section: DeckSection) => void;
  readonly poolFilters: ZonePoolFilters;
  readonly poolLayout: ZonePoolLayout;
  readonly poolQuery: string;
  readonly poolView: ZonePoolView;
  readonly verification: DeckVerification;
  readonly zone: DeckSection;
}) {
  const theme = useTheme();
  const isPool = poolView === "pool";
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
        <ThemedText
          style={{ color: verification.type === "legal" ? theme.positive : theme.warning }}
          type="mono"
        >
          {verification.type === "legal" ? "Legal" : "Incomplete"}
        </ThemedText>
      </View>

      <View style={styles.chips}>
        <BuildPickChip card={draft.legend} label="Legend" onEdit={() => onEditStep(0)} />
        <BuildPickChip card={draft.chosenChampion} label="Champion" onEdit={() => onEditStep(1)} />
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
          query={poolQuery}
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
