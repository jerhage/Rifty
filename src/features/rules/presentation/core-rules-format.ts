import { match } from "ts-pattern";

import type { Theme } from "@/constants/theme";

import type { CoreRule } from "@/features/rules/core-rule";
import type { ActiveCoreRuleHit, CoreRuleSearch } from "@/features/rules/core-rule-search";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import type {
  CoreRuleKeeping,
  SavedCoreRule,
} from "@/features/rules/presentation/core-rules-saved";
import {
  coreRuleDepthOf,
  isCoreRuleChapterNumber,
  type CoreRuleNumber,
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

/** Depth 1 only: the levels below would list all 1364 entries, which is the document again. */
function coreRulesContents(coreRules: readonly CoreRule[]): readonly CoreRule[] {
  return coreRules.filter(
    (coreRule) => coreRule.kind === "heading" && coreRuleDepthOf(coreRule.number) === 1,
  );
}

function numberedCoreRuleCount(coreRules: readonly CoreRule[]): number {
  return coreRules.filter((coreRule) => coreRule.kind === "rule").length;
}

/** The line under the title: what the document holds, or what the query found. */
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

/** The reader's own mark on one entry, named so a column of controls does not read alike. */
function coreRuleBookmarkLabel(number: CoreRuleNumber): string {
  return `Bookmark ${number}`;
}

/** Counts marks a query has filtered out of view too: a mark outlives what is on screen. */
function coreRuleBookmarkCountLabel(count: number): string {
  return `${count} bookmarked ${count === 1 ? "rule" : "rules"}`;
}

/** The context a kept rule is listed under, and the rule's own number when it stands under none. */
function coreRuleSavedContextLabel(coreRule: CoreRule, heading: CoreRule | null): string {
  return heading === null ? coreRule.number : heading.body;
}

/** The whole entry, because the block that jumps to it is one control and swallows its own text. */
function coreRuleSavedEntryLabel({ coreRule, heading }: SavedCoreRule): string {
  return `${coreRule.number}, ${coreRuleSavedContextLabel(coreRule, heading)}. ${coreRule.body}`;
}

/** Which of the two acts filed the rule, said on the entry so the list does not read as one act. */
const CORE_RULE_KEEPING_LABELS: Readonly<Record<CoreRuleKeeping, string>> = {
  bookmarked: "Bookmarked",
  noted: "Noted",
};

function coreRuleKeepingLabel(keeping: CoreRuleKeeping): string {
  return CORE_RULE_KEEPING_LABELS[keeping];
}

/** Heads the popup a rule's notes are written in, named so the rule it is about is never in doubt. */
function coreRuleNotesTitle(number: CoreRuleNumber): string {
  return `Notes on ${number}`;
}

/** Giving up a mark from the surface, named so a column of removals does not read alike. */
function coreRuleRemoveBookmarkLabel(number: CoreRuleNumber): string {
  return `Remove bookmark ${number}`;
}

/** The design sets the scratchpad and the favorited cards beside it under labels of this shape. */
function coreRuleSavedSectionLabel(count: number): string {
  return `Bookmarked and noted rules ${count}`;
}

/** An alpha byte on the token rather than a color of its own: both schemes state a six-digit hex. */
const CoreRuleSavedAlpha = {
  surface: "14",
  edge: "38",
} as const;

function coreRuleSavedWash(theme: Theme, weight: keyof typeof CoreRuleSavedAlpha): string {
  return `${theme.accent}${CoreRuleSavedAlpha[weight]}`;
}

const CORE_RULE_NOTE_EDGE_ALPHA = "47";

function coreRuleNoteEdge(theme: Theme): string {
  return `${theme.highlight}${CORE_RULE_NOTE_EDGE_ALPHA}`;
}

/** What the saved surface says instead of drawing an empty box, in either frame. */
const CORE_RULES_NOTHING_SAVED_MESSAGE =
  "Note a rule with the lines control or bookmark it with the flag. Either one files it here.";

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

/** One sentence for the screen and the announcement, so the two cannot drift apart. */
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

/** The number of the entry holding the hit is the only address this document has. */
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

/** `null` where the shape of the result held: a count ticking under a reader's own fingers is
 * not worth saying, while the document being replaced by a note, or coming back, is. */
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
  CORE_RULES_NOTHING_SAVED_MESSAGE,
  coreRuleBookmarkCountLabel,
  coreRuleBookmarkLabel,
  coreRuleChapters,
  coreRuleHitAnnouncement,
  coreRuleHitPositionLabel,
  coreRuleKeepingLabel,
  coreRuleNoteEdge,
  coreRuleNotesTitle,
  coreRuleRemoveBookmarkLabel,
  coreRuleRowKindOf,
  coreRuleSavedContextLabel,
  coreRuleSavedEntryLabel,
  coreRuleSavedSectionLabel,
  coreRuleSavedWash,
  coreRuleSearchAnnouncement,
  coreRulesContents,
  coreRulesCountLabel,
  coreRulesEditionLabel,
  numberedCoreRuleCount,
};
export type { CoreRuleRowKind };
