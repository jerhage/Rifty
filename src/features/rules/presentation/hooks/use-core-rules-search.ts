import { useCallback, useMemo, useState } from "react";

import type { CoreRule } from "@/features/rules/core-rule";
import { activeCoreRuleHit, searchCoreRules } from "@/features/rules/core-rule-search";
import {
  coreRuleRowHighlight,
  type CoreRuleRowHighlight,
} from "@/features/rules/presentation/core-rule-highlight";
import { coreRuleRowIndex } from "@/features/rules/presentation/core-rule-row-index";
import {
  coreRuleHitAnnouncement,
  coreRuleSearchAnnouncement,
} from "@/features/rules/presentation/core-rules-format";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";
import { useAnnouncement } from "@/hooks/use-announcement";

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
  const announce = useAnnouncement();
  const [query, setQuery] = useState("");
  const [hitIndex, setHitIndex] = useState(0);
  const [matchesOnly, setMatchesOnly] = useState(false);

  const search = useMemo(() => searchCoreRules(coreRules, query), [coreRules, query]);
  /**
   * Resolved once per query and per step rather than on every render: it is what the highlight of
   * every matching row is built from, and a fresh one each render would rebuild all of them and
   * defeat the rows' memo.
   */
  const activeHit = useMemo(() => activeCoreRuleHit(search, hitIndex), [hitIndex, search]);

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
   * The one way the document moves to a rule, whether a step onto a hit or a tap in the contents
   * asked for it. Matches-only narrows the list, so a rule the list does not hold moves nothing
   * rather than scrolling a wrong row into view.
   */
  const scrollToCoreRule = useCallback(
    (number: CoreRuleNumber) => {
      const row = rowIndex.get(number);

      if (row !== undefined) scrollToRow(row);
    },
    [rowIndex, scrollToRow],
  );

  /**
   * One act: resolve the hit the reader is about to stand on, move the document to the rule that
   * holds it, say where that leaves them, then move the counter. Matches-only shows every match, so
   * that rule is always in the shown list.
   *
   * The counter is the one thing on this screen that changes without a word of its own, so the step
   * speaks: a reader who cannot see `3 / 17` move is told, from the press that moved it. Each press
   * supersedes the last, so the newest position interrupts a position nobody stands on any more.
   */
  const stepToHit = useCallback(
    (step: number) => {
      const steppedIndex = hitIndex + step;
      const steppedHit = activeCoreRuleHit(search, steppedIndex);

      if (steppedHit.type === "hit") scrollToCoreRule(steppedHit.number);

      announce(coreRuleHitAnnouncement(search, steppedHit), "interrupting");
      setHitIndex(steppedIndex);
    },
    [announce, hitIndex, scrollToCoreRule, search],
  );

  /**
   * Typing puts the reader back on the first hit, so the counter never points at a hit the new
   * query does not have. Clearing the query also drops the filter: a document narrowed by a term
   * the reader can no longer see is a trap.
   *
   * It scans here rather than waiting for the render's memo to do it, because what is worth saying
   * depends on what the new query found and the announcement belongs in the act that changed it.
   * `coreRuleSearchAnnouncement` keeps that to the letters that change what is on screen.
   */
  const changeQuery = useCallback(
    (typed: string) => {
      const typedSearch = searchCoreRules(coreRules, typed);
      const spoken = coreRuleSearchAnnouncement(search, typedSearch);

      if (spoken !== null) announce(spoken);

      setQuery(typed);
      setHitIndex(0);

      if (typed.trim().length === 0) setMatchesOnly(false);
    },
    [announce, coreRules, search],
  );
  const stepToNextHit = useCallback(() => stepToHit(1), [stepToHit]);
  const stepToPreviousHit = useCallback(() => stepToHit(-1), [stepToHit]);
  const toggleMatchesOnly = useCallback(() => setMatchesOnly((current) => !current), []);

  return {
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
  };
}

export { useCoreRulesSearch };
