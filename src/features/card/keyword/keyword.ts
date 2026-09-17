import { z } from "zod/v4";

const keywordSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    reminderText: z.string().trim().min(1).nullable(),
  })
  .readonly();

function parseKeyword(value: unknown): Keyword {
  return keywordSchema.parse(value);
}

type Keyword = z.output<typeof keywordSchema>;

export { keywordSchema, parseKeyword };
export type { Keyword };
