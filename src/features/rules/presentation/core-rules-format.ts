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
    .with({ type: "searched" }, (searched) =>
      hitCountLabel(searched.hitCount, searched.matches.length),
    )
    .exhaustive();
}

function hitCountLabel(hits: number, rules: number): string {
  return `${hits} ${hits === 1 ? "hit" : "hits"} in ${rules} ${rules === 1 ? "rule" : "rules"}`;
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

/**
 * What the screen says where the document was when a query matches nothing, and what a reader who
 * cannot see it is told. One sentence, so the two can never drift apart.
 */
const CORE_RULES_NO_MATCHES_MESSAGE = "Nothing in the rules text matches that. Try a shorter term.";

const CORE_RULES_NO_HIT_MESSAGE = "Nothing matches, so there is no hit to step to.";
const CORE_RULES_SEARCH_CLEARED_MESSAGE = "Search cleared. The whole document is shown.";

/** What a search leaves the reader looking at: the document, the hits in it, or a note. */
type CoreRuleSearchShape = "found" | "foundNothing" | "noQuery";

function coreRuleSearchShape(search: CoreRuleSearch): CoreRuleSearchShape {
  return match(search)
    .with({ type: "noQuery" }, (): CoreRuleSearchShape => "noQuery")
    .with({ type: "searched" }, ({ hitCount }): CoreRuleSearchShape =>
      hitCount === 0 ? "foundNothing" : "found",
    )
    .exhaustive();
}

/**
 * What a step tells a reader who cannot watch the counter move: which hit of how many, and the
 * number of the entry holding it, which is the only address this document has.
 */
function coreRuleHitAnnouncement(search: CoreRuleSearch, activeHit: ActiveCoreRuleHit): string {
  return match({ search, activeHit })
    .with({ search: { type: "noQuery" } }, () => CORE_RULES_NO_HIT_MESSAGE)
    .with({ activeHit: { type: "noHit" } }, () => CORE_RULES_NO_HIT_MESSAGE)
    .with(
      { search: { type: "searched" }, activeHit: { type: "hit" } },
      ({ search: searched, activeHit: hit }) =>
        `Hit ${hit.hitIndex + 1} of ${searched.hitCount}, in ${hit.number}.`,
    )
    .exhaustive();
}

/**
 * What a new query is worth saying out loud, and `null` when it is worth nothing. A count that
 * changes with every letter is not worth a reader's breath — it is on screen, and they are typing.
 * What they cannot tell is that the document has been replaced by a note, or has come back, or is
 * whole again, so the shape of the result is what gets spoken and the letters between are silent.
 */
function coreRuleSearchAnnouncement(before: CoreRuleSearch, after: CoreRuleSearch): string | null {
  if (coreRuleSearchShape(after) === coreRuleSearchShape(before)) return null;

  return match(after)
    .with({ type: "noQuery" }, () => CORE_RULES_SEARCH_CLEARED_MESSAGE)
    .with({ type: "searched" }, ({ hitCount, matches }) =>
      hitCount === 0
        ? CORE_RULES_NO_MATCHES_MESSAGE
        : `${hitCountLabel(hitCount, matches.length)}.`,
    )
    .exhaustive();
}

function coreRulesEditionLabel(edition: CoreRulesEdition): string {
  return `Published ${edition.publishedOn}`;
}

export {
  CORE_RULES_NO_MATCHES_MESSAGE,
  coreRuleChapters,
  coreRuleHitAnnouncement,
  coreRuleHitPositionLabel,
  coreRuleRowKindOf,
  coreRuleSearchAnnouncement,
  coreRulesContents,
  coreRulesCountLabel,
  coreRulesEditionLabel,
  numberedCoreRuleCount,
};
export type { CoreRuleRowKind };
