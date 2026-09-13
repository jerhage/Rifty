import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { useLayoutSize } from "@/hooks/use-layout-size";
import { useTheme } from "@/hooks/use-theme";
import { UsableWidthProvider } from "@/hooks/use-usable-width";

import { placedCardTotal, placedCards, type DeckBuildStepId } from "../../../deck-build-steps";
import type { ZonePoolViewChoice } from "../../../deck-zone-pool";
import type { ZoneDraftViewState, ZonePoolViewState } from "../../../hooks/use-deck-build";
import { ZonePoolList } from "../zone-pool-list";
import { DeckDraftControls } from "./deck-draft-controls";
import { ZonePoolControls } from "./zone-pool-controls";

const PanelMaxWidth = 420;
const PoolShare = 1.6;

/** The panel takes its share of the pair and never more than its cap; the pool keeps the rest. */
function panelWidthFor(usableWidth: number): number {
  return Math.min(PanelMaxWidth, usableWidth / (PoolShare + 1));
}

function poolWidthFor(usableWidth: number): number {
  return usableWidth - panelWidthFor(usableWidth);
}

function ZonesStepColumns({
  draft,
  onChangeName,
  onEditStep,
  onLoadMorePool,
  onOpenCard,
  pool,
  viewChoice,
  zonePool,
}: {
  readonly draft: ZoneDraftViewState;
  readonly onChangeName: (name: string) => void;
  readonly onEditStep: (id: DeckBuildStepId) => void;
  readonly onLoadMorePool: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly pool: ZonePoolViewState;
  readonly viewChoice: ZonePoolViewChoice;
  readonly zonePool: readonly Card[];
}) {
  const theme = useTheme();
  const { usableWidth } = useLayoutSize();
  const panelWidth = panelWidthFor(usableWidth);
  const held = placedCardTotal(placedCards(draft.draft, pool.zone));

  return (
    <View style={styles.columns}>
      <View style={[styles.pool, { borderEndColor: theme.border }]}>
        <UsableWidthProvider width={usableWidth - panelWidth}>
          <ZonePoolControls draft={draft.draft} pool={pool} viewChoice={viewChoice} />

          <ZonePoolList
            draft={draft.draft}
            onLoadMorePool={onLoadMorePool}
            onOpenCard={onOpenCard}
            onSetQuantity={draft.setQuantity}
            poolLayout={pool.layout}
            poolView={viewChoice.shown}
            zone={pool.zone}
            zonePool={zonePool}
          />
        </UsableWidthProvider>
      </View>

      <View style={[styles.panel, { width: panelWidth }]}>
        <UsableWidthProvider width={panelWidth}>
          <DeckDraftControls
            draft={draft}
            onChangeName={onChangeName}
            onEditStep={onEditStep}
            onSelectZone={pool.setZone}
            zone={pool.zone}
          />

          <ThemedText
            accessibilityLabel={`In deck, ${held}`}
            accessibilityRole="header"
            style={styles.held}
            themeColor="textTertiary"
            type="mono"
          >
            {`In deck · ${held}`}
          </ThemedText>

          <ZonePoolList
            draft={draft.draft}
            onLoadMorePool={onLoadMorePool}
            onOpenCard={onOpenCard}
            onSetQuantity={draft.setQuantity}
            poolLayout="list"
            poolView="inDeck"
            zone={pool.zone}
            zonePool={zonePool}
          />
        </UsableWidthProvider>
      </View>
    </View>
  );
}

export { panelWidthFor, poolWidthFor, ZonesStepColumns };

const styles = StyleSheet.create({
  columns: {
    flex: 1,
    flexDirection: "row",
  },
  pool: {
    borderEndWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minWidth: 0,
  },
  panel: {
    flexGrow: 0,
    flexShrink: 0,
  },
  held: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three - 4,
  },
});
