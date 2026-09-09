import { z } from "zod/v4";

import { parseCard, type Card } from "@/features/catalog/card/card";
import { parseCardSummary, type CardSummary } from "@/features/catalog/card/card-summary";
import {
  cardClassificationSelectSchema,
  cardDomainSelectSchema,
  cardMediaSelectSchema,
  cardSpeedSelectSchema,
  cardMarketplaceReferenceSelectSchema,
  cardTagSelectSchema,
  catalogCardSelectSchema,
} from "@/infrastructure/database/catalog-schema/cards";

const cardKeywordRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number().int().nullable(),
});

interface CardPersistenceShape {
  readonly card: unknown;
  readonly classification: unknown;
  readonly media: unknown;
  readonly imageBaseUrl: string;
  readonly speeds: readonly unknown[];
  readonly keywords: readonly unknown[];
  readonly domains: readonly unknown[];
  readonly tags: readonly unknown[];
  readonly marketplaceReferences: readonly unknown[];
}

function toDomainCard({
  card,
  classification,
  media,
  imageBaseUrl,
  speeds,
  keywords,
  domains,
  tags,
  marketplaceReferences,
}: CardPersistenceShape): Card {
  const persistedCard = catalogCardSelectSchema.parse(card);
  const persistedClassification = cardClassificationSelectSchema.parse(classification);

  return parseCard({
    id: persistedCard.id,
    riftboundId: persistedCard.riftboundId,
    setCode: persistedCard.setCode,
    collectorNumber: persistedCard.collectorNumber,
    name: persistedCard.name,
    cleanName: persistedCard.cleanName,
    attributes: {
      energy: persistedCard.energy,
      might: persistedCard.might,
      power: persistedCard.power,
    },
    rulesText: {
      rich: persistedCard.rulesTextRich,
      plain: persistedCard.rulesTextPlain,
      flavour: persistedCard.flavourText,
    },
    orientation: persistedCard.orientation,
    isAlternateArt: persistedCard.isAlternateArt,
    isOvernumbered: persistedCard.isOvernumbered,
    isSignature: persistedCard.isSignature,
    sourceUpdatedAt: persistedCard.sourceUpdatedAt,
    classification: {
      typeId: persistedClassification.typeId,
      supertypeId: persistedClassification.supertypeId,
      rarityId: persistedClassification.rarityId,
    },
    domainIds: domains.map((domain) => cardDomainSelectSchema.parse(domain).domainId),
    speeds: speeds.map((speed) => cardSpeedSelectSchema.parse(speed).speed),
    keywords: keywords.map((keyword) => cardKeywordRowSchema.parse(keyword)),
    championName: persistedCard.championName,
    tagIds: tags.map((tag) => cardTagSelectSchema.parse(tag).tagId),
    imageUrl: cardImageUrl(imageBaseUrl, media),
    marketplaceReferences: marketplaceReferences.map((reference) => {
      const persistedReference = cardMarketplaceReferenceSelectSchema.parse(reference);
      return {
        marketplace: persistedReference.marketplace,
        externalId: persistedReference.externalId,
      };
    }),
  });
}

function toDomainCardSummary({
  card,
  domains,
  media,
  imageBaseUrl,
}: {
  readonly card: unknown;
  readonly domains: readonly unknown[];
  readonly media: unknown;
  readonly imageBaseUrl: string;
}): CardSummary {
  const persistedCard = catalogCardSelectSchema
    .pick({ id: true, riftboundId: true, name: true, orientation: true })
    .parse(card);
  return parseCardSummary({
    id: persistedCard.id,
    riftboundId: persistedCard.riftboundId,
    name: persistedCard.name,
    domainIds: domains.map((domain) => cardDomainSelectSchema.parse(domain).domainId),
    orientation: persistedCard.orientation,
    imageUrl: cardImageUrl(imageBaseUrl, media),
  });
}

function cardImageUrl(imageBaseUrl: string, media: unknown): string {
  const { imageFile } = cardMediaSelectSchema.pick({ imageFile: true }).parse(media);

  return `${imageBaseUrl}/${imageFile}`;
}

export { toDomainCard, toDomainCardSummary };
