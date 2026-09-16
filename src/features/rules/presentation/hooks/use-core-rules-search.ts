import { useCallback, useMemo, useState } from "react";

import type { CoreRule } from "@/features/rules/core-rule";
import { activeCoreRuleHit, searchCoreRules } from "@/features/rules/core-rule-search";
import {
  coreRuleRowHighlight,
  type CoreRuleRowHighlight,
} from "@/features/rules/presentation/core-rule-highlight";
import { coreRuleRowIndex } from "@/features/rules/presentation/core-rule-row-index";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

/**
 * The rules screen's own state: what was typed, which hit the reader stands on, and whether the
 * document is narrowed to the matches. The scan is memoized on the document and the query alone,
 * because it walks every entry and its details and must not run again when next or previous moves
 * the reader — `activeCoreRuleHit` resolves that against the scan already in hand.
 *
 * The hit index is unbounded: next and previous add and subtract, and the wrap in both directions
 * belongs to `activeCoreRuleHit`.
 *
 * `scrollToRow` moves the document, and stepping calls it directly rather than through an effect
 * watching the active hit. An effect would fire a render late, would fire again on any render that
 * happened to change the hit, and would put the reason the document moved somewhere no reader of
 * the press handler can see.
 */
function useCoreRulesSearch(coreRules: readonly CoreRule[], scrollToRow: (row: number) => void) {
  const [query, setQuery] = useState("");
  const [hitIndex, setHitIndex] = useState(0);
  const [matchesOnly, setMatchesOnly] = useState(false);

  const search = useMemo(() => searchCoreRules(coreRules, query), [coreRules, query]);
  const activeHit = activeCoreRuleHit(search, hitIndex);

  const highlights = useMemo(() => {
    const byNumber = new Map<CoreRuleNumber, CoreRuleRowHighlight>();

    if (search.type === "noQuery") return byNumber;

    for (const searchMatch of search.matches) {
      byNumber.set(
        searchMatch.number,
        coreRuleRowHighlight(searchMatch, search.queryLength, activeHit),
      );
    }

    return byNumber;
  }, [activeHit, search]);

  const shownCoreRules = useMemo(() => {
    if (search.type === "noQuery" || !matchesOnly) return coreRules;

    return coreRules.filter((coreRule) => search.shownNumbers.has(coreRule.number));
  }, [coreRules, matchesOnly, search]);

  const rowIndex = useMemo(() => coreRuleRowIndex(shownCoreRules), [shownCoreRules]);

  /**
   * One act: resolve the hit the reader is about to stand on, move the document to the rule that
   * holds it, then move the counter. Matches-only shows every match, so that rule is always in the
   * shown list — but when the lookup disagrees nothing moves, rather than a wrong row scrolling
   * into view.
   */
  const stepToHit = useCallback(
    (step: number) => {
      const steppedIndex = hitIndex + step;
      const steppedHit = activeCoreRuleHit(search, steppedIndex);

      if (steppedHit.type === "hit") {
        const row = rowIndex.get(steppedHit.number);

        if (row !== undefined) scrollToRow(row);
      }

      setHitIndex(steppedIndex);
    },
    [hitIndex, rowIndex, scrollToRow, search],
  );

  /**
   * Typing puts the reader back on the first hit, so the counter never points at a hit the new
   * query does not have. Clearing the query also drops the filter: a document narrowed by a term
   * the reader can no longer see is a trap.
   */
  const changeQuery = useCallback((typed: string) => {
    setQuery(typed);
    setHitIndex(0);

    if (typed.trim().length === 0) setMatchesOnly(false);
  }, []);
  const stepToNextHit = useCallback(() => stepToHit(1), [stepToHit]);
  const stepToPreviousHit = useCallback(() => stepToHit(-1), [stepToHit]);
  const toggleMatchesOnly = useCallback(() => setMatchesOnly((current) => !current), []);

  return {
    activeHit,
    changeQuery,
    highlights,
    matchesOnly,
    query,
    search,
    shownCoreRules,
    stepToNextHit,
    stepToPreviousHit,
    toggleMatchesOnly,
  };
}

export { useCoreRulesSearch };
