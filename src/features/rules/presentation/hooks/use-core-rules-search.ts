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

/** The hit index is unbounded; the wrap in both directions belongs to `activeCoreRuleHit`. */
function useCoreRulesSearch(coreRules: readonly CoreRule[], scrollToRow: (row: number) => void) {
  const announce = useAnnouncement();
  const [query, setQuery] = useState("");
  const [hitIndex, setHitIndex] = useState(0);
  const [matchesOnly, setMatchesOnly] = useState(false);

  const search = useMemo(() => searchCoreRules(coreRules, query), [coreRules, query]);
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

  /** Matches-only narrows the list, so a rule it no longer holds moves nothing at all. */
  const scrollToCoreRule = useCallback(
    (number: CoreRuleNumber) => {
      const row = rowIndex.get(number);

      if (row !== undefined) scrollToRow(row);
    },
    [rowIndex, scrollToRow],
  );

  /** The counter changes without a word of its own, so the press that moves it says where it lands. */
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

  /** It scans here rather than waiting for the render's memo: the announcement belongs in the act. */
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
