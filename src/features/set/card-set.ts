import { z } from "zod/v4";

import { marketplaceReferenceSchema } from "@/features/set/value-objects/marketplace-reference";
import { setCodeSchema } from "@/features/set/value-objects/set-code";

const cardSetSchema = z.object({
  code: setCodeSchema,
  name: z.string().trim().min(1),
  declaredCardCount: z.number().int().nonnegative(),
  publishedOn: z.string().trim().min(1),
  marketplaceReferences: z.array(marketplaceReferenceSchema),
});

function parseCardSet(value: unknown): CardSet {
  return cardSetSchema.parse(value);
}

type CardSet = z.output<typeof cardSetSchema>;

export { cardSetSchema, parseCardSet };
export type { CardSet };
