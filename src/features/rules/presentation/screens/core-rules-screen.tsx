import { useCallback, useMemo, useState, type ReactNode, type RefObject } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { match } from "ts-pattern";

import { EmptyState } from "@/components/ui/atoms/empty-state";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxReadingWidth, Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import type { CoreRuleRowHighlight } from "@/features/rules/presentation/core-rule-highlight";
import type { CoreRulesContentsPlacement } from "@/features/rules/presentation/core-rules-contents-placement";
import {
  useCoreRulesDocumentScroll,
  type CoreRuleScrollFailure,
} from "@/features/rules/presentation/hooks/use-core-rules-document-scroll";
import { useCoreRulesSearch } from "@/features/rules/presentation/hooks/use-core-rules-search";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";
import { useLayoutSize } from "@/hooks/use-layout-size";

import { CoreRulesContentsColumn } from "../components/contents/core-rules-contents-column";
import { CoreRulesContentsSheet } from "../components/contents/core-rules-contents-sheet";
import { CoreRuleRow } from "../components/core-rule-row";
import { CoreRulesHeader } from "../components/core-rules-header";

/** About one screen of rules, so the first paint is one screen's work rather than ten. */
const CORE_RULE_INITIAL_ROWS = 12;

/**
 * A batch is one frame's work. Kept near a screenful: larger drops frames while filling, smaller
 * leaves a jump's destination blank for longer.
 */
const CORE_RULE_ROWS_PER_BATCH = 12;

/**
 * Screens of rows kept mounted, the destination's own included — so four above and four below. The
 * default of ten each way holds hundreds of wrapped rule bodies for a document this long, and every
 * one of them costs on a pass. `removeClippedSubviews` is deliberately left at the platform's own
 * value: Android already detaches what is off screen, and forcing it on iOS blanks rows whose
 * height is not known in advance, which is every row here.
 */
const CORE_RULE_WINDOW_SCREENS = 9;

interface CoreRulesScreenProps {
  readonly coreRules: readonly CoreRule[];
  readonly edition: CoreRulesEdition;
}

/**
 * The whole document in printed order under a header that does not scroll.
 *
 * A query that finds nothing replaces the document rather than printing a note beneath it, because
 * a message at the far end of 1364 entries is a message nobody reads.
 *
 * The contents are the one place the two frames differ in what exists rather than in how much room
 * it has. A tablet stands them beside the document: the page becomes a spread that fills the frame,
 * the contents pinned against its leading edge and the rules text taking every point that is left.
 * A phone has nowhere to put a second column, so the same list arrives as a sheet over the
 * document, and the document keeps the capped, centered column a single column of reading gets.
 */
function CoreRulesScreen({ coreRules, edition }: CoreRulesScreenProps) {
  const { layoutClass } = useLayoutSize();
  const { documentRef, retryScrollToRow, scrollToRow } = useCoreRulesDocumentScroll();
  const {
    activeHit,
    changeQuery,
    highlights,
    matchesOnly,
    query,
    scrollToCoreRule,
    search,
    shownCoreRules,
    stepToNextHit,
    stepToPreviousHit,
    toggleMatchesOnly,
  } = useCoreRulesSearch(coreRules, scrollToRow);
  const [selectedNumber, setSelectedNumber] = useState<CoreRuleNumber | null>(null);
  const [contentsShowing, setContentsShowing] = useState(false);
  const foundNothing = search.type === "searched" && search.hitCount === 0;

  /**
   * One rule at a time, and pressing the chosen one again gives it up. Selection is the reader's
   * own mark on the document, so it outlives a new query and outlives being filtered out of view.
   */
  const selectCoreRule = useCallback((number: CoreRuleNumber) => {
    setSelectedNumber((current) => (current === number ? null : number));
  }, []);

  const showContents = useCallback(() => setContentsShowing(true), []);
  const hideContents = useCallback(() => setContentsShowing(false), []);
  const contentsPlacement: CoreRulesContentsPlacement =
    layoutClass === "tablet" ? { type: "beside" } : { type: "over", open: showContents };

  /** A sheet has said what it was opened to say once the reader has chosen, so it gives way. */
  const goToCoreRuleFromSheet = useCallback(
    (number: CoreRuleNumber) => {
      setContentsShowing(false);
      scrollToCoreRule(number);
    },
    [scrollToCoreRule],
  );

  return (
    <ThemedView style={styles.screen}>
      <CoreRulesHeader
        activeHit={activeHit}
        contentsPlacement={contentsPlacement}
        coreRules={coreRules}
        edition={edition}
        matchesOnly={matchesOnly}
        onChangeQuery={changeQuery}
        onStepToNextHit={stepToNextHit}
        onStepToPreviousHit={stepToPreviousHit}
        onToggleMatchesOnly={toggleMatchesOnly}
        query={query}
        search={search}
      />
      <CoreRulesPage contentsPlacement={contentsPlacement}>
        {contentsPlacement.type === "beside" ? (
          <CoreRulesContentsColumn coreRules={coreRules} onSelectEntry={scrollToCoreRule} />
        ) : null}
        <View style={styles.page}>
          {foundNothing ? (
            <CoreRulesNoMatches />
          ) : (
            <CoreRuleDocument
              contentsPlacement={contentsPlacement}
              coreRules={shownCoreRules}
              documentRef={documentRef}
              highlights={highlights}
              onScrollToRowFailed={retryScrollToRow}
              onSelectCoreRule={selectCoreRule}
              selectedNumber={selectedNumber}
            />
          )}
        </View>
      </CoreRulesPage>
      {contentsPlacement.type === "beside" ? null : (
        <CoreRulesContentsSheet
          coreRules={coreRules}
          isOpen={contentsShowing}
          onDismiss={hideContents}
          onSelectEntry={goToCoreRuleFromSheet}
        />
      )}
    </ThemedView>
  );
}

/**
 * What the reader reads, and how much of the frame it may use. A spread carries the side padding
 * and the safe-area insets for both of its columns, so nothing below it applies them a second time.
 */
function CoreRulesPage({
  children,
  contentsPlacement,
}: {
  readonly children: ReactNode;
  readonly contentsPlacement: CoreRulesContentsPlacement;
}) {
  const insets = useSafeAreaInsets();

  return match(contentsPlacement)
    .with({ type: "over" }, () => <View style={styles.reading}>{children}</View>)
    .with({ type: "beside" }, () => (
      <View
        style={[
          styles.reading,
          styles.spread,
          { paddingLeft: insets.left + Spacing.three, paddingRight: insets.right + Spacing.three },
        ]}
      >
        {children}
      </View>
    ))
    .exhaustive();
}

function CoreRuleDocument({
  contentsPlacement,
  coreRules,
  documentRef,
  highlights,
  onScrollToRowFailed,
  onSelectCoreRule,
  selectedNumber,
}: {
  readonly contentsPlacement: CoreRulesContentsPlacement;
  readonly coreRules: readonly CoreRule[];
  readonly documentRef: RefObject<FlatList<CoreRule> | null>;
  readonly highlights: ReadonlyMap<CoreRuleNumber, CoreRuleRowHighlight>;
  readonly onScrollToRowFailed: (failure: CoreRuleScrollFailure) => void;
  readonly onSelectCoreRule: (number: CoreRuleNumber) => void;
  readonly selectedNumber: CoreRuleNumber | null;
}) {
  const insets = useSafeAreaInsets();
  const rowState = useMemo(() => ({ highlights, selectedNumber }), [highlights, selectedNumber]);

  /**
   * Beside the contents the text takes the whole of what is left, and the page around it has
   * already paid the insets. Alone it is one column of reading, so it is capped and centered.
   */
  const columnStyle = match(contentsPlacement)
    .with({ type: "beside" }, () => styles.columnBesideContents)
    .with({ type: "over" }, () => [
      styles.column,
      { paddingLeft: insets.left + Spacing.three, paddingRight: insets.right + Spacing.three },
    ])
    .exhaustive();

  return (
    <FlatList
      contentContainerStyle={[columnStyle, { paddingBottom: insets.bottom + Spacing.five }]}
      data={coreRules}
      extraData={rowState}
      keyExtractor={(coreRule) => coreRule.number}
      onScrollToIndexFailed={onScrollToRowFailed}
      ref={documentRef}
      initialNumToRender={CORE_RULE_INITIAL_ROWS}
      maxToRenderPerBatch={CORE_RULE_ROWS_PER_BATCH}
      renderItem={({ item }) => (
        <CoreRuleRow
          coreRule={item}
          highlight={highlights.get(item.number) ?? null}
          onSelect={onSelectCoreRule}
          selected={item.number === selectedNumber}
        />
      )}
      style={styles.document}
      windowSize={CORE_RULE_WINDOW_SCREENS}
    />
  );
}

function CoreRulesNoMatches() {
  return (
    <View style={styles.noMatches}>
      <EmptyState message="Nothing in the rules text matches that. Try a shorter term." />
    </View>
  );
}

export { CoreRulesScreen };
export type { CoreRulesScreenProps };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  reading: {
    flex: 1,
  },
  spread: {
    flexDirection: "row",
    width: "100%",
  },
  page: {
    flex: 1,
    minWidth: 0,
  },
  document: {
    flex: 1,
  },
  column: {
    alignSelf: "center",
    maxWidth: MaxReadingWidth,
    paddingTop: Spacing.two,
    width: "100%",
  },
  columnBesideContents: {
    paddingLeft: Spacing.three,
    paddingTop: Spacing.two,
    width: "100%",
  },
  noMatches: {
    alignSelf: "center",
    maxWidth: MaxReadingWidth,
    paddingHorizontal: Spacing.three,
    width: "100%",
  },
});
