import { z } from "zod/v4";

import { cardIdSchema } from "./card";

const cardSummarySchema = z.object({
  id: cardIdSchema,
  name: z.string().trim().min(1),
});

function parseCardSummary(value: unknown): CardSummary {
  return cardSummarySchema.parse(value);
}

type CardSummary = z.output<typeof cardSummarySchema>;

export { cardSummarySchema, parseCardSummary };
export type { CardSummary };
