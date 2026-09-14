import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import { CardSortControl } from "@/features/card/presentation/components/card-sort-control";
import { useTheme } from "@/hooks/use-theme";

import { placedCardTotal, placedCards, type DeckBuildDraft } from "../../../deck-build-steps";
import {
  activePoolFilterCount,
  searchHint,
  sectionRuleSummary,
  type SectionPoolViewChoice,
} from "../../../deck-section-pool";
import type { SectionPoolViewState } from "../../../hooks/use-deck-build";
import { PoolLayoutToggle } from "../pool-layout-toggle";
import { PoolSearchRow } from "../pool-search-row";
import { PoolViewTabs } from "../pool-view-tabs";

function SectionPoolControls({
  draft,
  pool: {
    filters,
    openFilters,
    openSort,
    poolLayout,
    query,
    setPoolLayout,
    setQuery,
    setView,
    sort,
    toggleSortDirection,
    section,
  },
  viewChoice: { options, shown },
}: {
  readonly draft: DeckBuildDraft;
  /** Without the stored view or the section's setter: both belong to the deck, not to the pool. */
  readonly pool: Omit<SectionPoolViewState, "setSection" | "view">;
  readonly viewChoice: SectionPoolViewChoice;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isPool = shown === "pool";
  const placed = placedCards(draft, section);

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
        <PoolLayoutToggle onSelect={setPoolLayout} poolLayout={poolLayout} />
      </View>

      <ThemedText numberOfLines={1} themeColor="textTertiary" type="mono" style={styles.rule}>
        {sectionRuleSummary(section)}
      </ThemedText>

      {isPool ? (
        <>
          <PoolSearchRow
            filterCount={activePoolFilterCount(filters)}
            hint={searchHint(section)}
            onChangeQuery={setQuery}
            onOpenFilters={openFilters}
            query={query}
          />

          <View style={styles.sortRow}>
            <CardSortControl
              onOpenSort={openSort}
              onToggleDirection={toggleSortDirection}
              sort={sort}
            />
          </View>
        </>
      ) : null}
    </View>
  );
}

export { SectionPoolControls };

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
  sortRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: Spacing.two + 1,
  },
});
