import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { useLayoutSize } from "@/hooks/use-layout-size";
import { useTheme } from "@/hooks/use-theme";
import { UsableWidthProvider } from "@/hooks/use-usable-width";

import { placedCardTotal, placedCards, type DeckBuildStepId } from "../../../deck-build-steps";
import type { SectionPoolViewChoice } from "../../../deck-section-pool";
import type { SectionDraftViewState, SectionPoolViewState } from "../../../hooks/use-deck-build";
import { SectionPoolList } from "../section-pool-list";
import { DeckDraftControls } from "./deck-draft-controls";
import { SectionPoolControls } from "./section-pool-controls";

const PaneMaxWidth = 420;
const PoolShare = 1.6;

/** The pane takes its share of the pair and never more than its cap; the pool keeps the rest. */
function paneWidthFor(usableWidth: number): number {
  return Math.min(PaneMaxWidth, usableWidth / (PoolShare + 1));
}

function poolWidthFor(usableWidth: number): number {
  return usableWidth - paneWidthFor(usableWidth);
}

function SectionsStepColumns({
  draft,
  onChangeName,
  onEditStep,
  onLoadMorePool,
  onOpenCard,
  pool,
  viewChoice,
  sectionPool,
}: {
  readonly draft: SectionDraftViewState;
  readonly onChangeName: (name: string) => void;
  readonly onEditStep: (id: DeckBuildStepId) => void;
  readonly onLoadMorePool: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly pool: SectionPoolViewState;
  readonly viewChoice: SectionPoolViewChoice;
  readonly sectionPool: readonly Card[];
}) {
  const theme = useTheme();
  const { usableWidth } = useLayoutSize();
  const paneWidth = paneWidthFor(usableWidth);
  const inDeckCount = placedCardTotal(placedCards(draft.draft, pool.section));

  return (
    <View style={styles.columns}>
      <View style={[styles.pool, { borderEndColor: theme.border }]}>
        <UsableWidthProvider width={usableWidth - paneWidth}>
          <SectionPoolControls draft={draft.draft} pool={pool} viewChoice={viewChoice} />

          <SectionPoolList
            draft={draft.draft}
            onLoadMorePool={onLoadMorePool}
            onOpenCard={onOpenCard}
            onSetQuantity={draft.setQuantity}
            poolLayout={pool.poolLayout}
            poolView={viewChoice.shown}
            section={pool.section}
            sectionPool={sectionPool}
          />
        </UsableWidthProvider>
      </View>

      <View style={[styles.pane, { width: paneWidth }]}>
        <UsableWidthProvider width={paneWidth}>
          <DeckDraftControls
            draft={draft}
            onChangeName={onChangeName}
            onEditStep={onEditStep}
            onSelectSection={pool.setSection}
            section={pool.section}
          />

          <ThemedText
            accessibilityLabel={`In deck, ${inDeckCount}`}
            accessibilityRole="header"
            style={[styles.inDeck, { borderBottomColor: theme.border }]}
            themeColor="textTertiary"
            type="mono"
          >
            {`In deck · ${inDeckCount}`}
          </ThemedText>

          <SectionPoolList
            draft={draft.draft}
            onLoadMorePool={onLoadMorePool}
            onOpenCard={onOpenCard}
            onSetQuantity={draft.setQuantity}
            poolLayout="list"
            poolView="inDeck"
            section={pool.section}
            sectionPool={sectionPool}
          />
        </UsableWidthProvider>
      </View>
    </View>
  );
}

export { paneWidthFor, poolWidthFor, SectionsStepColumns };

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
  pane: {
    flexGrow: 0,
    flexShrink: 0,
  },
  inDeck: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three - 4,
  },
});
