import { z } from "zod/v4";

const keywordTargetKindSchema = z.enum([
  "self",
  "unit",
  "gear",
  "spell",
  "card",
  "player",
  "effect",
  "cost",
  "rule",
]);

type KeywordTargetKind = z.output<typeof keywordTargetKindSchema>;

export { keywordTargetKindSchema };
export type { KeywordTargetKind };
