import { z } from "zod/v4";

const coreRuleKindSchema = z.enum(["heading", "rule"]);

type CoreRuleKind = z.output<typeof coreRuleKindSchema>;

export { coreRuleKindSchema };
export type { CoreRuleKind };
