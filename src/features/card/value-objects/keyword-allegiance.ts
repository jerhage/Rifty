import { z } from "zod/v4";

const keywordAllegianceSchema = z.enum(["own", "friendly", "enemy", "any_player", "unspecified"]);

type KeywordAllegiance = z.output<typeof keywordAllegianceSchema>;

export { keywordAllegianceSchema };
export type { KeywordAllegiance };
