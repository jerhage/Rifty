import { z } from "zod/v4";

import { cardDomainSchema } from "@/features/card/value-objects/card-domain";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";
import { cardOrientationSchema } from "./card";

const cardSummarySchema = z.object({
  printingId: printingIdSchema,
  riftboundId: z.string().trim().min(1),
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
