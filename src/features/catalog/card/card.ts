import { z } from "zod/v4";

import { marketplaceReferenceSchema } from "../value-objects/marketplace-reference";
import { cardDomainSchema } from "../value-objects/card-domain";
import { cardSpeedSchema } from "../value-objects/card-speed";
import { cardTypeSchema } from "../value-objects/card-type";
import { setCodeSchema } from "../value-objects/set-code";
import { taxonomyIdSchema } from "../value-objects/taxonomy-id";

const cardIdSchema = z.string().trim().min(1);
const cardKeywordSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  value: z.number().int().positive().nullable(),
});
const cardOrientationSchema = z.enum(["landscape", "portrait"]);
const cardAttributesSchema = z.object({
  energy: z.number().int().nonnegative().nullable(),
  might: z.number().int().nonnegative().nullable(),
  power: z.number().int().nonnegative().nullable(),
});
const cardClassificationSchema = z.object({
  typeId: cardTypeSchema,
  supertypeId: taxonomyIdSchema.nullable(),
  rarityId: taxonomyIdSchema,
});
const cardSchema = z.object({
  id: cardIdSchema,
  riftboundId: z.string().trim().min(1),
  setCode: setCodeSchema,
  collectorNumber: z.number().int().nonnegative(),
  name: z.string().trim().min(1),
  cleanName: z.string().trim().min(1),
  attributes: cardAttributesSchema,
  rulesText: z.object({
    rich: z.string(),
    plain: z.string(),
    flavour: z.string().nullable(),
  }),
  orientation: cardOrientationSchema,
  isAlternateArt: z.boolean(),
  isOvernumbered: z.boolean(),
  isSignature: z.boolean(),
  sourceUpdatedAt: z.string().trim().min(1),
  classification: cardClassificationSchema,
  domainIds: z.array(cardDomainSchema),
  speeds: z.array(cardSpeedSchema),
  keywords: z.array(cardKeywordSchema),
  championName: z.string().trim().min(1).nullable(),
  tagIds: z.array(taxonomyIdSchema),
  imageUrl: z.url(),
  marketplaceReferences: z.array(marketplaceReferenceSchema),
});

function parseCard(value: unknown): Card {
  return cardSchema.parse(value);
}

type CardId = z.output<typeof cardIdSchema>;
type CardAttributes = z.output<typeof cardAttributesSchema>;
type CardClassification = z.output<typeof cardClassificationSchema>;
type CardKeyword = z.output<typeof cardKeywordSchema>;
type Card = z.output<typeof cardSchema>;

export {
  cardAttributesSchema,
  cardClassificationSchema,
  cardIdSchema,
  cardOrientationSchema,
  cardSchema,
  parseCard,
};
export type { Card, CardAttributes, CardClassification, CardId, CardKeyword };
