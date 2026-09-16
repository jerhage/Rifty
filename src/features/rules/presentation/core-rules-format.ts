import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import { isCoreRuleChapterNumber } from "@/features/rules/value-objects/core-rule-number";

/** The three ways the document renders: a chapter, a heading under it, and a numbered rule. */
type CoreRuleRowKind = "chapter" | "heading" | "rule";

function coreRuleRowKindOf(coreRule: CoreRule): CoreRuleRowKind {
  if (coreRule.kind === "rule") return "rule";

  return isCoreRuleChapterNumber(coreRule.number) ? "chapter" : "heading";
}

function coreRuleChapters(coreRules: readonly CoreRule[]): readonly CoreRule[] {
  return coreRules.filter((coreRule) => coreRuleRowKindOf(coreRule) === "chapter");
}

function numberedCoreRuleCount(coreRules: readonly CoreRule[]): number {
  return coreRules.filter((coreRule) => coreRule.kind === "rule").length;
}

function coreRulesCountLabel(coreRules: readonly CoreRule[]): string {
  const chapters = coreRuleChapters(coreRules).length;
  const numbered = numberedCoreRuleCount(coreRules);

  return `${chapters} ${chapters === 1 ? "chapter" : "chapters"} · ${numbered} numbered ${
    numbered === 1 ? "rule" : "rules"
  }`;
}

function coreRulesEditionLabel(edition: CoreRulesEdition): string {
  return `Published ${edition.publishedOn}`;
}

export {
  coreRuleChapters,
  coreRuleRowKindOf,
  coreRulesCountLabel,
  coreRulesEditionLabel,
  numberedCoreRuleCount,
};
export type { CoreRuleRowKind };
