import { z } from "zod/v4";

const keywordScopeSchema = z.enum(["self", "other"]);

type KeywordScope = z.output<typeof keywordScopeSchema>;

export { keywordScopeSchema };
export type { KeywordScope };
