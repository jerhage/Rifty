import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

/** Each shown rule's row in the list, so a hit's rule is a lookup rather than a walk. */
type CoreRuleRowIndex = ReadonlyMap<CoreRuleNumber, number>;

/**
 * Where each rule sits in the list **as currently shown**. Matches-only changes what the list
 * holds, so the row of a rule differs from its place in the document as soon as anything is
 * filtered out, and scrolling to the document's place would land on the wrong entry.
 *
 * A number the list does not hold is absent rather than zero, so a caller can move nowhere instead
 * of moving somewhere wrong.
 */
function coreRuleRowIndex(shownCoreRules: readonly CoreRule[]): CoreRuleRowIndex {
  const rows = new Map<CoreRuleNumber, number>();

  shownCoreRules.forEach((coreRule, row) => rows.set(coreRule.number, row));

  return rows;
}

export { coreRuleRowIndex };
export type { CoreRuleRowIndex };
