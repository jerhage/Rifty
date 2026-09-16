import { z } from "zod/v4";

const coreRuleDetailKindSchema = z.enum(["bullet", "example"]);

type CoreRuleDetailKind = z.output<typeof coreRuleDetailKindSchema>;

export { coreRuleDetailKindSchema };
export type { CoreRuleDetailKind };
