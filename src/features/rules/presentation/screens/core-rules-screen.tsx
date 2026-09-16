import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useCallback, useMemo, useState, type ReactNode, type RefObject } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import { EmptyState } from "@/components/ui/atoms/empty-state";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxReadingWidth, Spacing } from "@/constants/theme";
import type { NoteManager } from "@/features/annotation/note-manager";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import type { CoreRuleRowHighlight } from "@/features/rules/presentation/core-rule-highlight";
import type { CoreRulesContentsPlacement } from "@/features/rules/presentation/core-rules-contents-placement";
import {
  CORE_RULES_NO_MATCHES_MESSAGE,
  coreRuleRowKindOf,
} from "@/features/rules/presentation/core-rules-format";
import type { CoreRulesSavedPlacement } from "@/features/rules/presentation/core-rules-saved-placement";
import type { CoreRulesSheetState } from "@/features/rules/presentation/core-rules-sheet-state";
import { useCoreRulesDocumentScroll } from "@/features/rules/presentation/hooks/use-core-rules-document-scroll";
import { useCoreRulesSearch } from "@/features/rules/presentation/hooks/use-core-rules-search";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";
import { useLayoutSize } from "@/hooks/use-layout-size";

import { CoreRulesContentsColumn } from "../components/contents/core-rules-contents-column";
import { CoreRuleRow } from "../components/core-rule-row";
import { CoreRulesHeader } from "../components/core-rules-header";
import { CoreRulesSavedList } from "../components/saved/core-rules-saved-list";
import { CoreRulesSavedPane } from "../components/saved/core-rules-saved-pane";
import { CoreRulesSheet } from "../components/sheet/core-rules-sheet";

interface CoreRulesScreenProps {
  /** Every rule the reader has marked, whether or not a query has filtered it out of view. */
  readonly bookmarkedNumbers: ReadonlySet<CoreRuleNumber>;
  readonly clock: Clock;
  readonly coreRules: readonly CoreRule[];
  readonly edition: CoreRulesEdition;
  readonly idGenerator: IdGenerator;
  readonly noteManager: NoteManager;
  readonly onToggleBookmark: (number: CoreRuleNumber) => void;
}

function CoreRulesScreen({
  bookmarkedNumbers,
  clock,
  coreRules,
  edition,
  idGenerator,
  noteManager,
  onToggleBookmark,
}: CoreRulesScreenProps) {
  const { layoutClass } = useLayoutSize();
  const { documentRef, scrollToRow } = useCoreRulesDocumentScroll();
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
  const [sheetState, setSheetState] = useState<CoreRulesSheetState>("hidden");
  const [savedPaneExpanded, setSavedPaneExpanded] = useState(false);
  const foundNothing = search.type === "searched" && search.hitCount === 0;

  /** Selection outlives a new query and outlives being filtered out of view. */
  const selectCoreRule = useCallback((number: CoreRuleNumber) => {
    setSelectedNumber((current) => (current === number ? null : number));
  }, []);

  const showContents = useCallback(() => setSheetState("contents"), []);
  const showSaved = useCallback(() => setSheetState("saved"), []);
  const hideSheet = useCallback(() => setSheetState("hidden"), []);
  const toggleSavedPane = useCallback(() => setSavedPaneExpanded((open) => !open), []);
  const contentsPlacement: CoreRulesContentsPlacement =
    layoutClass === "tablet" ? { type: "beside" } : { type: "over", open: showContents };
  const savedPlacement: CoreRulesSavedPlacement =
    layoutClass === "tablet"
      ? { type: "beside", expanded: savedPaneExpanded, toggle: toggleSavedPane }
      : { type: "over", open: showSaved };

  /** The movement first and the dismissal second, the order `stepToHit` already follows. */
  const goToCoreRuleFromSheet = useCallback(
    (number: CoreRuleNumber) => {
      scrollToCoreRule(number);
      setSheetState("hidden");
    },
    [scrollToCoreRule],
  );

  return (
    <ThemedView style={styles.screen}>
      <CoreRulesHeader
        activeHit={activeHit}
        bookmarkedCount={bookmarkedNumbers.size}
        contentsPlacement={contentsPlacement}
        coreRules={coreRules}
        edition={edition}
        matchesOnly={matchesOnly}
        onChangeQuery={changeQuery}
        onStepToNextHit={stepToNextHit}
        onStepToPreviousHit={stepToPreviousHit}
        onToggleMatchesOnly={toggleMatchesOnly}
        query={query}
        savedPlacement={savedPlacement}
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
              bookmarkedNumbers={bookmarkedNumbers}
              contentsPlacement={contentsPlacement}
              coreRules={shownCoreRules}
              documentRef={documentRef}
              highlights={highlights}
              onSelectCoreRule={selectCoreRule}
              onToggleBookmark={onToggleBookmark}
              selectedNumber={selectedNumber}
            />
          )}
        </View>
        {savedPlacement.type === "beside" ? (
          <CoreRulesSavedPane
            bookmarkedCount={bookmarkedNumbers.size}
            expanded={savedPlacement.expanded}
            onToggle={savedPlacement.toggle}
          >
            <CoreRulesSavedList
              bookmarkedNumbers={bookmarkedNumbers}
              clock={clock}
              coreRules={coreRules}
              idGenerator={idGenerator}
              noteManager={noteManager}
              onGoToCoreRule={scrollToCoreRule}
              onRemoveBookmark={onToggleBookmark}
            />
          </CoreRulesSavedPane>
        ) : null}
      </CoreRulesPage>
      {savedPlacement.type === "beside" ? null : (
        <CoreRulesSheet
          bookmarkedNumbers={bookmarkedNumbers}
          clock={clock}
          coreRules={coreRules}
          idGenerator={idGenerator}
          noteManager={noteManager}
          onDismiss={hideSheet}
          onGoToCoreRule={goToCoreRuleFromSheet}
          onRemoveBookmark={onToggleBookmark}
          onShowFace={setSheetState}
          state={sheetState}
        />
      )}
    </ThemedView>
  );
}

/** A spread pays the insets and the side padding for all its columns, so nothing below repeats them. */
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
  bookmarkedNumbers,
  contentsPlacement,
  coreRules,
  documentRef,
  highlights,
  onSelectCoreRule,
  onToggleBookmark,
  selectedNumber,
}: {
  readonly bookmarkedNumbers: ReadonlySet<CoreRuleNumber>;
  readonly contentsPlacement: CoreRulesContentsPlacement;
  readonly coreRules: readonly CoreRule[];
  readonly documentRef: RefObject<FlashListRef<CoreRule> | null>;
  readonly highlights: ReadonlyMap<CoreRuleNumber, CoreRuleRowHighlight>;
  readonly onSelectCoreRule: (number: CoreRuleNumber) => void;
  readonly onToggleBookmark: (number: CoreRuleNumber) => void;
  readonly selectedNumber: CoreRuleNumber | null;
}) {
  const insets = useSafeAreaInsets();
  const rowState = useMemo(
    () => ({ bookmarkedNumbers, highlights, selectedNumber }),
    [bookmarkedNumbers, highlights, selectedNumber],
  );

  const columnStyle = match(contentsPlacement)
    .with({ type: "beside" }, () => styles.columnBesideContents)
    .with({ type: "over" }, () => [
      styles.column,
      { paddingLeft: insets.left + Spacing.three, paddingRight: insets.right + Spacing.three },
    ])
    .exhaustive();

  return (
    <FlashList
      contentContainerStyle={[columnStyle, { paddingBottom: insets.bottom + Spacing.five }]}
      data={coreRules}
      extraData={rowState}
      getItemType={coreRuleRowKindOf}
      keyExtractor={(coreRule) => coreRule.number}
      ref={documentRef}
      renderItem={({ item }) => (
        <CoreRuleRow
          bookmarked={bookmarkedNumbers.has(item.number)}
          coreRule={item}
          highlight={highlights.get(item.number) ?? null}
          onSelect={onSelectCoreRule}
          onToggleBookmark={onToggleBookmark}
          selected={item.number === selectedNumber}
        />
      )}
      style={styles.document}
    />
  );
}

function CoreRulesNoMatches() {
  return (
    <View style={styles.noMatches}>
      <EmptyState message={CORE_RULES_NO_MATCHES_MESSAGE} />
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
