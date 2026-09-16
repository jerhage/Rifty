import { z } from "zod/v4";

const coreRuleNumberSchema = z.string().trim().min(1);

/**
 * The printed identifier's segment count, so `103.2.a` is three deep. The parser carries its own
 * copy for the seed it builds, because a script may not import the application.
 */
function coreRuleDepthOf(number: CoreRuleNumber): number {
  return number.split(".").length;
}

type CoreRuleNumber = z.output<typeof coreRuleNumberSchema>;

export { coreRuleDepthOf, coreRuleNumberSchema };
export type { CoreRuleNumber };
