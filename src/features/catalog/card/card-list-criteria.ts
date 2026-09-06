import { z } from "zod/v4";

import { setCodeSchema } from "../value-objects/set-code";
import { taxonomyIdSchema } from "../value-objects/taxonomy-id";

const cardListCriteriaSchema = z.object({
  setCodes: z.array(setCodeSchema).optional(),
  typeIds: z.array(taxonomyIdSchema).optional(),
  supertypeIds: z.array(taxonomyIdSchema).optional(),
  rarityIds: z.array(taxonomyIdSchema).optional(),
  domainIds: z.array(taxonomyIdSchema).optional(),
  tagIds: z.array(taxonomyIdSchema).optional(),
  search: z.string().trim().min(1).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

function parseCardListCriteria(value: unknown): CardListCriteria {
  return cardListCriteriaSchema.parse(value);
}

type CardListCriteria = z.output<typeof cardListCriteriaSchema>;

export { cardListCriteriaSchema, parseCardListCriteria };
export type { CardListCriteria };
