import { z } from "zod/v4";

import { cardDomainSchema } from "../value-objects/card-domain";
import { cardIdSchema, cardOrientationSchema } from "./card";

const cardSummarySchema = z.object({
  id: cardIdSchema,
  name: z.string().trim().min(1),
  domainIds: z.array(cardDomainSchema),
  orientation: cardOrientationSchema,
  imageUrl: z.url(),
});

function parseCardSummary(value: unknown): CardSummary {
  return cardSummarySchema.parse(value);
}

type CardSummary = z.output<typeof cardSummarySchema>;

export { cardSummarySchema, parseCardSummary };
export type { CardSummary };
