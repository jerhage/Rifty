import { z } from "zod/v4";

import { setCodeSchema } from "@/features/set/value-objects/set-code";
import { cardDomainSchema } from "@/features/card/value-objects/card-domain";
import { cardTypeSchema } from "@/features/card/value-objects/card-type";
import { taxonomyIdSchema } from "@/features/card/value-objects/taxonomy-id";

const cardSearchSchema = z
  .discriminatedUnion("type", [
    z.object({ type: z.literal("name"), text: z.string().trim().min(1) }),
    z.object({ type: z.literal("rulesText"), text: z.string().trim().min(1) }),
    z.object({ type: z.literal("nameOrRulesText"), text: z.string().trim().min(1) }),
  ])
  .readonly();

const cardSortDirectionSchema = z.enum(["ascending", "descending"]);

const cardSortSchema = z
  .discriminatedUnion("type", [
    z.object({ type: z.literal("catalogOrder") }),
    z.object({ type: z.literal("name"), direction: cardSortDirectionSchema }),
    z.object({ type: z.literal("energy"), direction: cardSortDirectionSchema }),
    z.object({ type: z.literal("might"), direction: cardSortDirectionSchema }),
    z.object({ type: z.literal("power"), direction: cardSortDirectionSchema }),
  ])
  .readonly();

const cardNumericFilterSchema = z
  .discriminatedUnion("type", [
    z.object({ type: z.literal("exact"), value: z.number().int().nonnegative() }),
    z.object({ type: z.literal("atLeast"), value: z.number().int().nonnegative() }),
    z.object({ type: z.literal("atMost"), value: z.number().int().nonnegative() }),
    z.object({
      type: z.literal("between"),
      minimum: z.number().int().nonnegative(),
      maximum: z.number().int().nonnegative(),
    }),
  ])
  .refine(
    (filter) => filter.type !== "between" || filter.minimum <= filter.maximum,
    "A numeric filter minimum cannot exceed its maximum.",
  )
  .readonly();

const cardListCriteriaSchema = z
  .object({
    riftboundIds: z.array(z.string().trim().min(1)).readonly().optional(),
    setCodes: z.array(setCodeSchema).readonly().optional(),
    typeIds: z.array(cardTypeSchema).readonly().optional(),
    supertypeIds: z.array(taxonomyIdSchema).readonly().optional(),
    rarityIds: z.array(taxonomyIdSchema).readonly().optional(),
    /** Use for an 'AND' query (e.g. show me cards that have both calm AND mind domains)*/
    domainIds: z.array(cardDomainSchema).readonly().optional(),
    /** Use for an 'OR' query (e.g. show me cards that have either calm OR mind domains) */
    anyDomainIds: z.array(cardDomainSchema).readonly().optional(),
    withinDomainIds: z.array(cardDomainSchema).readonly().optional(),
    tagIds: z.array(taxonomyIdSchema).readonly().optional(),
    keywordIds: z.array(z.string().trim().min(1)).readonly().optional(),
    championNames: z.array(z.string().trim().min(1)).readonly().optional(),
    onlyBookmarked: z.boolean().optional(),
    energy: cardNumericFilterSchema.optional(),
    might: cardNumericFilterSchema.optional(),
    power: cardNumericFilterSchema.optional(),
    search: cardSearchSchema.optional(),
    sort: cardSortSchema.optional(),
    limit: z.number().int().positive().max(100).optional(),
    offset: z.number().int().nonnegative().optional(),
  })
  .readonly();

function parseCardListCriteria(value: unknown): CardListCriteria {
  return cardListCriteriaSchema.parse(value);
}

type CardListCriteria = z.output<typeof cardListCriteriaSchema>;
type CardSearch = z.output<typeof cardSearchSchema>;
type CardSort = z.output<typeof cardSortSchema>;
type CardNumericFilter = z.output<typeof cardNumericFilterSchema>;

export {
  cardListCriteriaSchema,
  cardNumericFilterSchema,
  cardSearchSchema,
  cardSortSchema,
  parseCardListCriteria,
};
export type { CardListCriteria, CardNumericFilter, CardSearch, CardSort };
