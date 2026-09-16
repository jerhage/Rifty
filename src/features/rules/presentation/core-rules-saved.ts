import type { CoreRule } from "@/features/rules/core-rule";
import {
  coreRuleAncestorNumbersOf,
  type CoreRuleNumber,
} from "@/features/rules/value-objects/core-rule-number";

/** One marked rule as the saved surface lists it: the rule, and the heading it stands under. */
interface SavedCoreRule {
  readonly coreRule: CoreRule;
  /** Absent where no ancestor of the number was printed as a heading. */
  readonly heading: CoreRule | null;
}

/**
 * The **nearest** heading rather than a fixed level: the document runs five deep, so the heading
 * over `648.8.f.1` may be `648.8` or `648` and nothing in the number says which. A mark naming a
 * number the document no longer holds is dropped here.
 */
function savedCoreRules(
  coreRules: readonly CoreRule[],
  isBookmarked: (number: CoreRuleNumber) => boolean,
): readonly SavedCoreRule[] {
  const byNumber = new Map(coreRules.map((coreRule) => [coreRule.number, coreRule]));

  return coreRules
    .filter((coreRule) => isBookmarked(coreRule.number))
    .map((coreRule) => ({
      coreRule,
      heading: nearestHeadingOf(coreRule.number, byNumber),
    }));
}

function nearestHeadingOf(
  number: CoreRuleNumber,
  byNumber: ReadonlyMap<CoreRuleNumber, CoreRule>,
): CoreRule | null {
  const ancestors = [...coreRuleAncestorNumbersOf(number)].reverse();

  for (const ancestorNumber of ancestors) {
    const ancestor = byNumber.get(ancestorNumber);

    if (ancestor !== undefined && ancestor.kind === "heading") return ancestor;
  }

  return null;
}

export { savedCoreRules };
export type { SavedCoreRule };
