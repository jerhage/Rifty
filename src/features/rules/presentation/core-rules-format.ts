import { match } from "ts-pattern";

import type { CoreRule } from "@/features/rules/core-rule";
import type { ActiveCoreRuleHit, CoreRuleSearch } from "@/features/rules/core-rule-search";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import {
  coreRuleDepthOf,
  isCoreRuleChapterNumber,
} from "@/features/rules/value-objects/core-rule-number";

/** The three ways the document renders: a chapter, a heading under it, and a numbered rule. */
type CoreRuleRowKind = "chapter" | "heading" | "rule";

function coreRuleRowKindOf(coreRule: CoreRule): CoreRuleRowKind {
  if (coreRule.kind === "rule") return "rule";

  return isCoreRuleChapterNumber(coreRule.number) ? "chapter" : "heading";
}

function coreRuleChapters(coreRules: readonly CoreRule[]): readonly CoreRule[] {
  return coreRules.filter((coreRule) => coreRuleRowKindOf(coreRule) === "chapter");
}

/**
 * The table of contents: every depth-1 heading in document order, five of which are chapters. It is
 * a filter of the document the screen already holds rather than a second read, and it stops at
 * depth 1: taking the levels below would list all 1364 entries, which is the document again rather
 * than a list of where to go in it.
 */
function coreRulesContents(coreRules: readonly CoreRule[]): readonly CoreRule[] {
  return coreRules.filter(
    (coreRule) => coreRule.kind === "heading" && coreRuleDepthOf(coreRule.number) === 1,
  );
}

function numberedCoreRuleCount(coreRules: readonly CoreRule[]): number {
  return coreRules.filter((coreRule) => coreRule.kind === "rule").length;
}

/**
 * The one line under the title: what the document holds while nothing is searched, and what the
 * query found once there is one.
 */
function coreRulesCountLabel(coreRules: readonly CoreRule[], search: CoreRuleSearch): string {
  return match(search)
    .with({ type: "noQuery" }, () => documentCountLabel(coreRules))
    .with({ type: "searched" }, (searched) => {
      const hits = searched.hitCount;
      const rules = searched.matches.length;

      return `${hits} ${hits === 1 ? "hit" : "hits"} in ${rules} ${rules === 1 ? "rule" : "rules"}`;
    })
    .exhaustive();
}

function documentCountLabel(coreRules: readonly CoreRule[]): string {
  const chapters = coreRuleChapters(coreRules).length;
  const numbered = numberedCoreRuleCount(coreRules);

  return `${chapters} ${chapters === 1 ? "chapter" : "chapters"} · ${numbered} numbered ${
    numbered === 1 ? "rule" : "rules"
  }`;
}

/** Where the reader stands among the hits, counted from one, and `0 / 0` when nothing matched. */
function coreRuleHitPositionLabel(search: CoreRuleSearch, activeHit: ActiveCoreRuleHit): string {
  return match({ search, activeHit })
    .with({ search: { type: "noQuery" } }, () => "0 / 0")
    .with({ activeHit: { type: "noHit" } }, () => "0 / 0")
    .with(
      { search: { type: "searched" }, activeHit: { type: "hit" } },
      ({ search: searched, activeHit: hit }) => `${hit.hitIndex + 1} / ${searched.hitCount}`,
    )
    .exhaustive();
}

function coreRulesEditionLabel(edition: CoreRulesEdition): string {
  return `Published ${edition.publishedOn}`;
}

export {
  coreRuleChapters,
  coreRuleHitPositionLabel,
  coreRuleRowKindOf,
  coreRulesContents,
  coreRulesCountLabel,
  coreRulesEditionLabel,
  numberedCoreRuleCount,
};
export type { CoreRuleRowKind };
