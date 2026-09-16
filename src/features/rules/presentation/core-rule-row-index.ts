import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

/** Each shown rule's row in the list, so a hit's rule is a lookup rather than a walk. */
type CoreRuleRowIndex = ReadonlyMap<CoreRuleNumber, number>;

/**
 * The row **as currently shown**: matches-only filters the list, so the document's place would land
 * on the wrong entry. A number the list does not hold is absent rather than zero.
 */
function coreRuleRowIndex(shownCoreRules: readonly CoreRule[]): CoreRuleRowIndex {
  const rows = new Map<CoreRuleNumber, number>();

  shownCoreRules.forEach((coreRule, row) => rows.set(coreRule.number, row));

  return rows;
}

export { coreRuleRowIndex };
export type { CoreRuleRowIndex };
