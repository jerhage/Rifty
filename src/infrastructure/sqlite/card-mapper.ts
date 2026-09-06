import { parseCard, type Card } from "@/features/catalog/card/card";
import {
  cardClassificationSelectSchema,
  cardDomainSelectSchema,
  cardMarketplaceReferenceSelectSchema,
  cardMediaSelectSchema,
  cardTagSelectSchema,
  catalogCardSelectSchema,
} from "@/infrastructure/database/catalog-persistence-schemas";

interface CardPersistenceShape {
  readonly card: unknown;
  readonly classification: unknown;
  readonly media: unknown;
  readonly domains: readonly unknown[];
  readonly tags: readonly unknown[];
  readonly marketplaceReferences: readonly unknown[];
}

function toDomainCard({
  card,
  classification,
  media,
  domains,
  tags,
  marketplaceReferences,
}: CardPersistenceShape): Card {
  const persistedCard = catalogCardSelectSchema.parse(card);
  const persistedClassification = cardClassificationSelectSchema.parse(classification);
  const persistedMedia = cardMediaSelectSchema.parse(media);

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
    tagIds: tags.map((tag) => cardTagSelectSchema.parse(tag).tagId),
    media: {
      imageAssetId: persistedMedia.imageAssetId,
      artist: persistedMedia.artist,
      accessibilityText: persistedMedia.accessibilityText,
    },
    marketplaceReferences: marketplaceReferences.map((reference) => {
      const persistedReference = cardMarketplaceReferenceSelectSchema.parse(reference);
      return {
        marketplace: persistedReference.marketplace,
        externalId: persistedReference.externalId,
      };
    }),
  });
}

export { toDomainCard };
