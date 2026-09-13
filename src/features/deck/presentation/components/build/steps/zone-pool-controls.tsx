import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { placedCardTotal, placedCards, type DeckBuildDraft } from "../../../deck-build-steps";
import {
  activePoolFilterCount,
  searchHint,
  zoneRuleSummary,
  type ZonePoolViewChoice,
} from "../../../deck-zone-pool";
import type { ZonePoolViewState } from "../../../hooks/use-deck-build";
import { PoolLayoutToggle } from "../pool-layout-toggle";
import { PoolSearchRow } from "../pool-search-row";
import { PoolViewTabs } from "../pool-view-tabs";

function ZonePoolControls({
  draft,
  pool: { filters, layout, openFilters, query, setLayout, setQuery, setView, zone },
  viewChoice: { options, shown },
}: {
  readonly draft: DeckBuildDraft;
  /** Without the stored view or the zone's setter: both belong to the deck, not to the pool. */
  readonly pool: Omit<ZonePoolViewState, "setZone" | "view">;
  readonly viewChoice: ZonePoolViewChoice;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isPool = shown === "pool";
  const placed = placedCards(draft, zone);

  return (
    <View
      style={[
        styles.controls,
        {
          borderBottomColor: theme.border,
          paddingLeft: insets.left + Spacing.three,
          paddingRight: insets.right + Spacing.three,
        },
      ]}
    >
      <View style={styles.viewRow}>
        <View style={styles.tabs}>
          <PoolViewTabs
            deckCount={placedCardTotal(placed)}
            onSelect={setView}
            options={options}
            view={shown}
          />
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

export { ZonePoolControls };

const styles = StyleSheet.create({
  controls: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.three - 4,
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
