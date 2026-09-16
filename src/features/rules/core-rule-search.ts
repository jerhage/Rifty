import type { CoreRule } from "./core-rule";
import { coreRuleAncestorNumbersOf, type CoreRuleNumber } from "./value-objects/core-rule-number";

/** Which piece of a rule's text an occurrence sits in: its body, or the detail at that position. */
type CoreRuleSearchTarget =
  | { readonly type: "body" }
  | { readonly type: "detail"; readonly position: number };

/**
 * One searched piece of text and the start offset of every occurrence in it, ascending. No length
 * per offset: every occurrence is `queryLength` long.
 */
interface CoreRuleSearchPassage {
  readonly target: CoreRuleSearchTarget;
  readonly offsets: readonly number[];
}

interface CoreRuleSearchMatch {
  readonly number: CoreRuleNumber;
  readonly passages: readonly CoreRuleSearchPassage[];
  readonly hitCount: number;
}

/**
 * `noQuery` is not a failure and not an empty result: nothing was searched, so the screen shows the
 * whole document unhighlighted rather than filtering it to `shownNumbers`.
 */
type CoreRuleSearch =
  | { readonly type: "noQuery" }
  | {
      readonly type: "searched";
      readonly query: string;
      readonly queryLength: number;
      readonly matches: readonly CoreRuleSearchMatch[];
      readonly hitCount: number;
      readonly shownNumbers: ReadonlySet<CoreRuleNumber>;
    };

type ActiveCoreRuleHit =
  | {
      readonly type: "hit";
      readonly hitIndex: number;
      readonly number: CoreRuleNumber;
      readonly target: CoreRuleSearchTarget;
      readonly offset: number;
    }
  | { readonly type: "noHit" };

/**
 * Occurrences never overlap — `aa` in `aaa` is one hit — because the screen highlights by splitting
 * the text at each offset, and overlapping ranges cannot be split.
 */
function offsetsOf(text: string, query: string): readonly number[] {
  const haystack = text.toLowerCase();
  const offsets: number[] = [];

  for (
    let found = haystack.indexOf(query);
    found !== -1;
    found = haystack.indexOf(query, found + query.length)
  ) {
    offsets.push(found);
  }

  return offsets;
}

function passagesOf(coreRule: CoreRule, query: string): readonly CoreRuleSearchPassage[] {
  const passages: CoreRuleSearchPassage[] = [];
  const bodyOffsets = offsetsOf(coreRule.body, query);

  if (bodyOffsets.length > 0) passages.push({ target: { type: "body" }, offsets: bodyOffsets });

  for (const detail of coreRule.details) {
    const detailOffsets = offsetsOf(detail.body, query);

    if (detailOffsets.length > 0) {
      passages.push({
        target: { type: "detail", position: detail.position },
        offsets: detailOffsets,
      });
    }
  }

  return passages;
}

/**
 * Scans the loaded document once. Hits are numbered in document order: the rules as given, each
 * rule's body before its details, and each passage's offsets ascending. `shownNumbers` carries
 * every matching rule and its ancestors, so a match is never displayed without its headings.
 *
 * Matching may move to FTS5 later, which is why stepping through the hits is a separate function:
 * only this one would change.
 */
function searchCoreRules(coreRules: readonly CoreRule[], query: string): CoreRuleSearch {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) return { type: "noQuery" };

  const needle = trimmedQuery.toLowerCase();
  const matches: CoreRuleSearchMatch[] = [];
  const shownNumbers = new Set<CoreRuleNumber>();
  let hitCount = 0;

  for (const coreRule of coreRules) {
    const passages = passagesOf(coreRule, needle);

    if (passages.length === 0) continue;

    const ruleHitCount = passages.reduce((total, passage) => total + passage.offsets.length, 0);

    matches.push({ number: coreRule.number, passages, hitCount: ruleHitCount });
    hitCount += ruleHitCount;

    for (const ancestor of coreRuleAncestorNumbersOf(coreRule.number)) shownNumbers.add(ancestor);

    shownNumbers.add(coreRule.number);
  }

  return {
    type: "searched",
    query: trimmedQuery,
    queryLength: trimmedQuery.length,
    matches,
    hitCount,
    shownNumbers,
  };
}

/**
 * Resolves the screen's hit counter against a scan without repeating it. Next and previous move an
 * unbounded integer, so the index wraps both ways and a negative one lands on the last hit.
 */
function activeCoreRuleHit(search: CoreRuleSearch, index: number): ActiveCoreRuleHit {
  if (search.type === "noQuery" || search.hitCount === 0) return { type: "noHit" };

  const hitIndex = ((index % search.hitCount) + search.hitCount) % search.hitCount;
  let remaining = hitIndex;

  for (const match of search.matches) {
    if (remaining >= match.hitCount) {
      remaining -= match.hitCount;
      continue;
    }

    for (const passage of match.passages) {
      for (const offset of passage.offsets) {
        if (remaining === 0) {
          return { type: "hit", hitIndex, number: match.number, target: passage.target, offset };
        }

        remaining -= 1;
      }
    }
  }

  throw new Error(`The hit counts of ${search.query} disagree with its offsets.`);
}

export { activeCoreRuleHit, searchCoreRules };
export type {
  ActiveCoreRuleHit,
  CoreRuleSearch,
  CoreRuleSearchMatch,
  CoreRuleSearchPassage,
  CoreRuleSearchTarget,
};
