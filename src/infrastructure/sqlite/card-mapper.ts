import { z } from "zod/v4";

import { parseCard, type Card, type CardKeyword } from "@/features/card/card";
import { parseCardSummary, type CardSummary } from "@/features/card/card-summary";
import { cardKeywordTargetSelectSchema } from "@/infrastructure/database/reference-schema/keywords";
import {
  cardDomainSelectSchema,
  cardMediaSelectSchema,
  cardPrintingSelectSchema,
  cardSelectSchema,
  cardSpeedSelectSchema,
  cardMarketplaceReferenceSelectSchema,
  cardTagSelectSchema,
} from "@/infrastructure/database/reference-schema/cards";

const cardKeywordRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number().int().nullable(),
  targets: z.array(
    cardKeywordTargetSelectSchema.pick({
      targetKind: true,
      targetIsToken: true,
      allegiance: true,
    }),
  ),
});

interface CardPersistenceShape {
  readonly card: unknown;
  readonly printing: unknown;
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
  printing,
  media,
  imageBaseUrl,
  speeds,
  keywords,
  domains,
  tags,
  marketplaceReferences,
}: CardPersistenceShape): Card {
  const persistedCard = cardSelectSchema.parse(card);
  const persistedPrinting = cardPrintingSelectSchema.parse(printing);

  return parseCard({
    printingId: persistedPrinting.id,
    cardId: persistedCard.id,
    riftboundId: persistedPrinting.riftboundId,
    setCode: persistedPrinting.setCode,
    collectorNumber: persistedPrinting.collectorNumber,
    name: persistedPrinting.printedName,
    cleanName: persistedCard.cleanName,
    attributes: {
      energy: persistedCard.energy,
      might: persistedCard.might,
      power: persistedCard.power,
    },
    rulesText: {
      rich: persistedCard.rulesTextRich,
      plain: persistedCard.rulesTextPlain,
      flavour: persistedPrinting.flavourText,
    },
    orientation: persistedCard.orientation,
    isAlternateArt: persistedPrinting.isAlternateArt,
    isOvernumbered: persistedPrinting.isOvernumbered,
    isSignature: persistedPrinting.isSignature,
    sourceUpdatedAt: persistedPrinting.sourceUpdatedAt,
    classification: {
      typeId: persistedCard.typeId,
      supertypeId: persistedCard.supertypeId,
      rarityId: persistedPrinting.rarityId,
    },
    domainIds: domains.map((domain) => cardDomainSelectSchema.parse(domain).domainId),
    speeds: speeds.map((speed) => cardSpeedSelectSchema.parse(speed).speed),
    keywords: keywords.map((keyword) => toDomainKeyword(keyword)),
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
  printing,
  domains,
  media,
  imageBaseUrl,
}: {
  readonly card: unknown;
  readonly printing: unknown;
  readonly domains: readonly unknown[];
  readonly media: unknown;
  readonly imageBaseUrl: string;
}): CardSummary {
  const persistedCard = cardSelectSchema.pick({ orientation: true }).parse(card);
  const persistedPrinting = cardPrintingSelectSchema
    .pick({ id: true, riftboundId: true, printedName: true })
    .parse(printing);

  return parseCardSummary({
    printingId: persistedPrinting.id,
    riftboundId: persistedPrinting.riftboundId,
    name: persistedPrinting.printedName,
    domainIds: domains.map((domain) => cardDomainSelectSchema.parse(domain).domainId),
    orientation: persistedCard.orientation,
    imageUrl: cardImageUrl(imageBaseUrl, media),
  });
}

function toDomainKeyword(keyword: unknown): CardKeyword {
  const persistedKeyword = cardKeywordRowSchema.parse(keyword);

  return {
    id: persistedKeyword.id,
    name: persistedKeyword.name,
    value: persistedKeyword.value,
    targets: persistedKeyword.targets.map((target) => ({
      kind: target.targetKind,
      isToken: target.targetIsToken,
      allegiance: target.allegiance,
    })),
  };
}

function cardImageUrl(imageBaseUrl: string, media: unknown): string {
  const { imageFile } = cardMediaSelectSchema.pick({ imageFile: true }).parse(media);

  return `${imageBaseUrl}/${imageFile}`;
}

export { toDomainCard, toDomainCardSummary };
