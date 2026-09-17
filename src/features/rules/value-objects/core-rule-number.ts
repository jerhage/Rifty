import { z } from "zod/v4";

const coreRuleNumberSchema = z.string().trim().min(1).brand<"CoreRuleNumber">();

/**
 * The printed identifier's segment count, so `103.2.a` is three deep. The parser carries its own
 * copy for the seed it builds, because a script may not import the application.
 */
function coreRuleDepthOf(number: CoreRuleNumber): number {
  return number.split(".").length;
}

/**
 * The enclosing numbers, outermost first: `103.2.a` is under `103` and `103.2`. The document's
 * parent chain is its segment chain, so an ancestor is read off the number rather than looked up.
 */
function coreRuleAncestorNumbersOf(number: CoreRuleNumber): readonly CoreRuleNumber[] {
  const segments = number.split(".");

  return segments
    .slice(0, -1)
    .map((_, index) => coreRuleNumberSchema.parse(segments.slice(0, index + 1).join(".")));
}

/**
 * The five chapters are numbered on century boundaries — `000`, `100`, `500`, `600`, `700` — so a
 * chapter is read off the number rather than stored. The document marks no chapter of its own.
 */
function isCoreRuleChapterNumber(number: CoreRuleNumber): boolean {
  const segments = number.split(".");

  return segments.length === 1 && Number(segments.at(0)) % 100 === 0;
}

type CoreRuleNumber = z.output<typeof coreRuleNumberSchema>;

export {
  coreRuleAncestorNumbersOf,
  coreRuleDepthOf,
  coreRuleNumberSchema,
  isCoreRuleChapterNumber,
};
export type { CoreRuleNumber };
