import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useCallback, useMemo, useState, type ReactNode, type RefObject } from "react";
import { StyleSheet, View } from "react-native";
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
import { CoreRuleNotePopup } from "../components/note/core-rule-note-popup";
import { CoreRulesHeader } from "../components/core-rules-header";
import { CoreRulesSavedPane } from "../components/saved/core-rules-saved-pane";
import { CoreRulesSavedSurface } from "../components/saved/core-rules-saved-surface";
import { CoreRulesSheet } from "../components/sheet/core-rules-sheet";

interface CoreRulesScreenProps {
  readonly bookmarkedCount: number;
  readonly bookmarkFor: (number: CoreRuleNumber) => ReactNode;
  readonly coreRules: readonly CoreRule[];
  readonly edition: CoreRulesEdition;
  /** Asked of every rule the document holds, whether or not a query has filtered it out of view. */
  readonly isBookmarked: (number: CoreRuleNumber) => boolean;
  /** The same reach as `isBookmarked`, and independent of it: neither act implies the other. */
  readonly isNoted: (number: CoreRuleNumber) => boolean;
  readonly notesControlFor: (number: CoreRuleNumber, onOpen: () => void) => ReactNode;
  readonly notesFor: (number: CoreRuleNumber) => ReactNode;
  readonly onRemoveBookmark: (number: CoreRuleNumber) => void;
}

function CoreRulesScreen({
  bookmarkedCount,
  bookmarkFor,
  coreRules,
  edition,
  isBookmarked,
  isNoted,
  notesControlFor,
  notesFor,
  onRemoveBookmark,
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
  const [notedCoreRule, setNotedCoreRule] = useState<CoreRule | null>(null);
  const [sheetState, setSheetState] = useState<CoreRulesSheetState>("hidden");
  const [savedPaneExpanded, setSavedPaneExpanded] = useState(false);
  const foundNothing = search.type === "searched" && search.hitCount === 0;

  /** Selection outlives a new query and outlives being filtered out of view. */
  const selectCoreRule = useCallback((number: CoreRuleNumber) => {
    setSelectedNumber((current) => (current === number ? null : number));
  }, []);

  const openNotes = useCallback((coreRule: CoreRule) => setNotedCoreRule(coreRule), []);
  const closeNotes = useCallback(() => setNotedCoreRule(null), []);
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
        bookmarkedCount={bookmarkedCount}
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
              bookmarkFor={bookmarkFor}
              contentsPlacement={contentsPlacement}
              coreRules={shownCoreRules}
              documentRef={documentRef}
              highlights={highlights}
              notesControlFor={notesControlFor}
              onOpenNotes={openNotes}
              onSelectCoreRule={selectCoreRule}
              selectedNumber={selectedNumber}
            />
          )}
        </View>
        {savedPlacement.type === "beside" ? (
          <CoreRulesSavedPane
            bookmarkedCount={bookmarkedCount}
            expanded={savedPlacement.expanded}
            onToggle={savedPlacement.toggle}
          >
            <CoreRulesSavedSurface
              coreRules={coreRules}
              isBookmarked={isBookmarked}
              isNoted={isNoted}
              notesFor={notesFor}
              onGoToCoreRule={scrollToCoreRule}
              onRemoveBookmark={onRemoveBookmark}
            />
          </CoreRulesSavedPane>
        ) : null}
      </CoreRulesPage>
      {savedPlacement.type === "beside" ? null : (
        <CoreRulesSheet
          bookmarkedCount={bookmarkedCount}
          coreRules={coreRules}
          isBookmarked={isBookmarked}
          isNoted={isNoted}
          notesFor={notesFor}
          onDismiss={hideSheet}
          onGoToCoreRule={goToCoreRuleFromSheet}
          onRemoveBookmark={onRemoveBookmark}
          onShowFace={setSheetState}
          state={sheetState}
        />
      )}
      <CoreRuleNotePopup
        coreRule={notedCoreRule}
        coreRules={coreRules}
        notes={notedCoreRule === null ? null : notesFor(notedCoreRule.number)}
        onDismiss={closeNotes}
      />
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
  bookmarkFor,
  contentsPlacement,
  coreRules,
  documentRef,
  highlights,
  notesControlFor,
  onOpenNotes,
  onSelectCoreRule,
  selectedNumber,
}: {
  readonly bookmarkFor: (number: CoreRuleNumber) => ReactNode;
  readonly contentsPlacement: CoreRulesContentsPlacement;
  readonly coreRules: readonly CoreRule[];
  readonly documentRef: RefObject<FlashListRef<CoreRule> | null>;
  readonly highlights: ReadonlyMap<CoreRuleNumber, CoreRuleRowHighlight>;
  readonly notesControlFor: (number: CoreRuleNumber, onOpen: () => void) => ReactNode;
  readonly onOpenNotes: (coreRule: CoreRule) => void;
  readonly onSelectCoreRule: (number: CoreRuleNumber) => void;
  readonly selectedNumber: CoreRuleNumber | null;
}) {
  const insets = useSafeAreaInsets();
  const rowState = useMemo(
    () => ({ bookmarkFor, highlights, notesControlFor, selectedNumber }),
    [bookmarkFor, highlights, notesControlFor, selectedNumber],
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
          bookmarkFor={bookmarkFor}
          coreRule={item}
          highlight={highlights.get(item.number) ?? null}
          notesControlFor={notesControlFor}
          onOpenNotes={onOpenNotes}
          onSelect={onSelectCoreRule}
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
