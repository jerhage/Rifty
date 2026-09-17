import { z } from "zod/v4";

import { coreRuleDetailKindSchema } from "@/features/rules/value-objects/core-rule-detail-kind";
import { coreRuleKindSchema } from "@/features/rules/value-objects/core-rule-kind";
import { coreRuleNumberSchema } from "@/features/rules/value-objects/core-rule-number";

const coreRuleDetailSchema = z
  .object({
    position: z.number().int().nonnegative(),
    kind: coreRuleDetailKindSchema,
    body: z.string().trim().min(1),
  })
  .readonly();

/**
 * One numbered entry of the rules document. `position` carries document order because a rule number
 * cannot: `103` sorts before `50` as text, and `103.2.a` has no numeric reading at all.
 */
const coreRuleSchema = z
  .object({
    number: coreRuleNumberSchema,
    parentNumber: coreRuleNumberSchema.nullable(),
    position: z.number().int().nonnegative(),
    kind: coreRuleKindSchema,
    body: z.string().trim().min(1),
    details: z.array(coreRuleDetailSchema).readonly(),
  })
  .readonly();

function parseCoreRule(value: unknown): CoreRule {
  return coreRuleSchema.parse(value);
}

type CoreRuleDetail = z.output<typeof coreRuleDetailSchema>;
type CoreRule = z.output<typeof coreRuleSchema>;

export { coreRuleDetailSchema, coreRuleSchema, parseCoreRule };
export type { CoreRule, CoreRuleDetail };
