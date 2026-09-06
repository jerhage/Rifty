import { z } from "zod/v4";

import { marketplaceReferenceSchema } from "../value-objects/marketplace-reference";
import { setCodeSchema } from "../value-objects/set-code";
import { taxonomyIdSchema } from "../value-objects/taxonomy-id";

const cardIdSchema = z.string().trim().min(1);
const cardOrientationSchema = z.enum(["landscape", "portrait"]);
const cardAttributesSchema = z.object({
  energy: z.number().int().nonnegative().nullable(),
  might: z.number().int().nonnegative().nullable(),
  power: z.number().int().nonnegative().nullable(),
});
const cardClassificationSchema = z.object({
  typeId: taxonomyIdSchema,
  supertypeId: taxonomyIdSchema.nullable(),
  rarityId: taxonomyIdSchema,
});
const cardMediaSchema = z.object({
  imageAssetId: z.string().trim().min(1),
  artist: z.string().trim().min(1).nullable(),
  accessibilityText: z.string().trim().min(1).nullable(),
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
  domainIds: z.array(taxonomyIdSchema),
  tagIds: z.array(taxonomyIdSchema),
  media: cardMediaSchema,
  marketplaceReferences: z.array(marketplaceReferenceSchema),
});

function parseCard(value: unknown): Card {
  return cardSchema.parse(value);
}

type CardId = z.output<typeof cardIdSchema>;
type CardAttributes = z.output<typeof cardAttributesSchema>;
type CardClassification = z.output<typeof cardClassificationSchema>;
type CardMedia = z.output<typeof cardMediaSchema>;
type Card = z.output<typeof cardSchema>;

export {
  cardAttributesSchema,
  cardClassificationSchema,
  cardIdSchema,
  cardMediaSchema,
  cardOrientationSchema,
  cardSchema,
  parseCard,
};
export type { Card, CardAttributes, CardClassification, CardId, CardMedia };
