import { z } from "zod/v4";

import { marketplaceReferenceSchema } from "@/features/set/value-objects/marketplace-reference";
import { cardDomainSchema } from "@/features/card/value-objects/card-domain";
import { cardIdSchema } from "@/features/card/value-objects/card-id";
import { printingFinishSchema } from "@/features/card/value-objects/printing-finish";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";
import { cardSpeedSchema } from "@/features/card/value-objects/card-speed";
import { cardTypeSchema } from "@/features/card/value-objects/card-type";
import { keywordAllegianceSchema } from "@/features/card/value-objects/keyword-allegiance";
import { keywordTargetKindSchema } from "@/features/card/value-objects/keyword-target-kind";
import { setCodeSchema } from "@/features/set/value-objects/set-code";
import { taxonomyIdSchema } from "@/features/card/value-objects/taxonomy-id";

const cardKeywordTargetSchema = z
  .object({
    kind: keywordTargetKindSchema,
    isToken: z.boolean(),
    allegiance: keywordAllegianceSchema,
  })
  .readonly();
const cardKeywordSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    value: z.number().int().positive().nullable(),
    targets: z.array(cardKeywordTargetSchema).readonly(),
  })
  .readonly();
const cardOrientationSchema = z.enum(["landscape", "portrait"]);
const cardAttributesSchema = z
  .object({
    energy: z.number().int().nonnegative().nullable(),
    might: z.number().int().nonnegative().nullable(),
    power: z.number().int().nonnegative().nullable(),
  })
  .readonly();
const cardClassificationSchema = z
  .object({
    typeId: cardTypeSchema,
    supertypeId: taxonomyIdSchema.nullable(),
    rarityId: taxonomyIdSchema,
  })
  .readonly();
const cardSchema = z
  .object({
    printingId: printingIdSchema,
    cardId: cardIdSchema,
    riftboundId: z.string().trim().min(1),
    setCode: setCodeSchema,
    collectorNumber: z.string().trim().min(1),
    name: z.string().trim().min(1),
    cleanName: z.string().trim().min(1),
    attributes: cardAttributesSchema,
    rulesText: z
      .object({
        rich: z.string(),
        plain: z.string(),
        flavour: z.string().nullable(),
      })
      .readonly(),
    orientation: cardOrientationSchema,
    finish: printingFinishSchema,
    sourceUpdatedAt: z.string().trim().min(1),
    classification: cardClassificationSchema,
    domainIds: z.array(cardDomainSchema).readonly(),
    speeds: z.array(cardSpeedSchema).readonly(),
    keywords: z.array(cardKeywordSchema).readonly(),
    championName: z.string().trim().min(1).nullable(),
    tagIds: z.array(taxonomyIdSchema).readonly(),
    imageUrl: z.url(),
    marketplaceReferences: z.array(marketplaceReferenceSchema).readonly(),
  })
  .readonly();

function parseCard(value: unknown): Card {
  return cardSchema.parse(value);
}

type CardAttributes = z.output<typeof cardAttributesSchema>;
type CardClassification = z.output<typeof cardClassificationSchema>;
type CardKeyword = z.output<typeof cardKeywordSchema>;
type CardKeywordTarget = z.output<typeof cardKeywordTargetSchema>;
type CardOrientation = z.output<typeof cardOrientationSchema>;
type Card = z.output<typeof cardSchema>;

export {
  cardAttributesSchema,
  cardClassificationSchema,
  cardOrientationSchema,
  cardSchema,
  parseCard,
};
export type {
  Card,
  CardAttributes,
  CardClassification,
  CardKeyword,
  CardKeywordTarget,
  CardOrientation,
};
