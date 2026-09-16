import { match } from "ts-pattern";

import type { Theme } from "@/constants/theme";
import type {
  ActiveCoreRuleHit,
  CoreRuleSearchMatch,
  CoreRuleSearchTarget,
} from "@/features/rules/core-rule-search";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

/** Every occurrence is `length` long, so the text splits at the offsets without a second scan. */
interface CoreRuleHighlight {
  readonly offsets: readonly number[];
  readonly length: number;
  readonly activeOffset: number | null;
}

/** What one row draws: its body, its details by position, and whether it holds the active hit. */
interface CoreRuleRowHighlight {
  readonly body: CoreRuleHighlight | null;
  readonly detailsByPosition: ReadonlyMap<number, CoreRuleHighlight>;
  readonly holdsActiveHit: boolean;
}

/** One run of a highlighted text: plain, an occurrence, or the occurrence the reader stands on. */
type CoreRuleTextRunKind = "plain" | "hit" | "activeHit";

interface CoreRuleTextRun {
  readonly key: string;
  readonly kind: CoreRuleTextRunKind;
  readonly text: string;
}

/** An alpha byte on the token: `opacity` would fade the text with the background behind it. */
const CoreRuleHighlightAlpha = {
  /** Behind an occurrence that is not the active hit. */
  occurrence: "38",
  /** The left bar of a row holding a hit that is not the active one. */
  bar: "47",
  /** Behind the whole row holding the active hit. */
  row: "12",
} as const;

type CoreRuleHighlightWeight = keyof typeof CoreRuleHighlightAlpha;

function coreRuleHighlightWash(theme: Theme, weight: CoreRuleHighlightWeight): string {
  return `${theme.highlight}${CoreRuleHighlightAlpha[weight]}`;
}

function sameCoreRuleSearchTarget(one: CoreRuleSearchTarget, other: CoreRuleSearchTarget): boolean {
  return match([one, other] as const)
    .with([{ type: "body" }, { type: "body" }], () => true)
    .with([{ type: "detail" }, { type: "detail" }], ([left, right]) => {
      return left.position === right.position;
    })
    .with([{ type: "body" }, { type: "detail" }], () => false)
    .with([{ type: "detail" }, { type: "body" }], () => false)
    .exhaustive();
}

function activeOffsetIn(
  target: CoreRuleSearchTarget,
  activeHit: ActiveCoreRuleHit,
  coreRuleNumber: CoreRuleNumber,
): number | null {
  if (activeHit.type === "noHit" || activeHit.number !== coreRuleNumber) return null;

  return sameCoreRuleSearchTarget(activeHit.target, target) ? activeHit.offset : null;
}

/** No text is rescanned: the search already reported every occurrence and their shared length. */
function coreRuleRowHighlight(
  searchMatch: CoreRuleSearchMatch,
  queryLength: number,
  activeHit: ActiveCoreRuleHit,
): CoreRuleRowHighlight {
  const passages = searchMatch.passages.map((passage) => ({
    target: passage.target,
    highlight: {
      offsets: passage.offsets,
      length: queryLength,
      activeOffset: activeOffsetIn(passage.target, activeHit, searchMatch.number),
    },
  }));
  const detailsByPosition = new Map<number, CoreRuleHighlight>();
  let body: CoreRuleHighlight | null = null;

  for (const passage of passages) {
    if (passage.target.type === "detail") {
      detailsByPosition.set(passage.target.position, passage.highlight);
      continue;
    }

    body = passage.highlight;
  }

  return {
    body,
    detailsByPosition,
    holdsActiveHit: passages.some((passage) => passage.highlight.activeOffset !== null),
  };
}

/** What sits behind a row and the border around it. Transparent is the row claimed by nothing. */
interface CoreRuleRowSurface {
  readonly backgroundColor: string;
  readonly borderColor: string;
}

/** Selection outranks the active hit on every channel, so a chosen row stays visibly chosen. */
function coreRuleRowSurface(
  theme: Theme,
  highlight: CoreRuleRowHighlight | null,
  selected: boolean,
): CoreRuleRowSurface {
  if (selected) {
    return { backgroundColor: theme.backgroundSelected, borderColor: theme.borderStrong };
  }

  return {
    backgroundColor:
      highlight?.holdsActiveHit === true ? coreRuleHighlightWash(theme, "row") : "transparent",
    borderColor: "transparent",
  };
}

/** The bar beside a numbered rule is its state channel: selection, the active hit, a hit, or none. */
function coreRuleBarColor(
  theme: Theme,
  highlight: CoreRuleRowHighlight | null,
  selected: boolean,
): string {
  if (selected) return theme.accent;

  if (highlight === null) return theme.border;

  return highlight.holdsActiveHit ? theme.highlight : coreRuleHighlightWash(theme, "bar");
}

function coreRuleTextRuns(text: string, highlight: CoreRuleHighlight): readonly CoreRuleTextRun[] {
  const runs: CoreRuleTextRun[] = [];
  let cursor = 0;

  for (const offset of highlight.offsets) {
    if (offset > cursor) {
      runs.push({ key: `plain-${cursor}`, kind: "plain", text: text.slice(cursor, offset) });
    }

    runs.push({
      key: `hit-${offset}`,
      kind: offset === highlight.activeOffset ? "activeHit" : "hit",
      text: text.slice(offset, offset + highlight.length),
    });
    cursor = offset + highlight.length;
  }

  if (cursor < text.length) {
    runs.push({ key: `plain-${cursor}`, kind: "plain", text: text.slice(cursor) });
  }

  return runs;
}

export {
  coreRuleBarColor,
  coreRuleHighlightWash,
  coreRuleRowHighlight,
  coreRuleRowSurface,
  coreRuleTextRuns,
};
export type {
  CoreRuleHighlight,
  CoreRuleHighlightWeight,
  CoreRuleRowHighlight,
  CoreRuleRowSurface,
  CoreRuleTextRun,
  CoreRuleTextRunKind,
};
