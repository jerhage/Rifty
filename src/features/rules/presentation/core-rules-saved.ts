import type { CoreRule } from "@/features/rules/core-rule";
import {
  coreRuleAncestorNumbersOf,
  type CoreRuleNumber,
} from "@/features/rules/value-objects/core-rule-number";

/** Why a rule is filed on the saved surface. Marking wins where a rule is both marked and noted. */
type CoreRuleKeeping = "bookmarked" | "noted";

/** One kept rule as the saved surface lists it: the rule, the heading it stands under, and why. */
interface SavedCoreRule {
  readonly coreRule: CoreRule;
  /** Absent where no ancestor of the number was printed as a heading. */
  readonly heading: CoreRule | null;
  readonly keeping: CoreRuleKeeping;
}

/**
 * The union of what is marked and what is noted, in document order rather than the order either act
 * was made. The two are independent, so a rule noted without a mark belongs here as much as a rule
 * marked without a note. A number the document no longer holds is dropped here.
 */
function savedCoreRules(
  coreRules: readonly CoreRule[],
  isBookmarked: (number: CoreRuleNumber) => boolean,
  isNoted: (number: CoreRuleNumber) => boolean,
): readonly SavedCoreRule[] {
  const byNumber = coreRulesByNumber(coreRules);

  return coreRules
    .filter((coreRule) => isBookmarked(coreRule.number) || isNoted(coreRule.number))
    .map((coreRule) => ({
      coreRule,
      heading: nearestHeadingOf(coreRule.number, byNumber),
      keeping: isBookmarked(coreRule.number) ? "bookmarked" : "noted",
    }));
}

/**
 * The **nearest** heading rather than a fixed level: the document runs five deep, so the heading
 * over `648.8.f.1` may be `648.8` or `648` and nothing in the number says which.
 */
function nearestCoreRuleHeading(
  coreRules: readonly CoreRule[],
  number: CoreRuleNumber,
): CoreRule | null {
  return nearestHeadingOf(number, coreRulesByNumber(coreRules));
}

function coreRulesByNumber(coreRules: readonly CoreRule[]): ReadonlyMap<CoreRuleNumber, CoreRule> {
  return new Map(coreRules.map((coreRule) => [coreRule.number, coreRule]));
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

export { nearestCoreRuleHeading, savedCoreRules };
export type { CoreRuleKeeping, SavedCoreRule };
