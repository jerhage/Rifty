import { parseCardSet, type CardSet } from "@/features/catalog/set/card-set";
import {
  cardSetSelectSchema,
  setMarketplaceReferenceSelectSchema,
} from "@/infrastructure/database/catalog-persistence-schemas";

interface SetPersistenceShape {
  readonly cardSet: unknown;
  readonly marketplaceReferences: readonly unknown[];
}

function toDomainCardSet({ cardSet, marketplaceReferences }: SetPersistenceShape): CardSet {
  const persistedSet = cardSetSelectSchema.parse(cardSet);

  return parseCardSet({
    code: persistedSet.code,
    sourceId: persistedSet.sourceId,
    name: persistedSet.name,
    declaredCardCount: persistedSet.declaredCardCount,
    publishedOn: persistedSet.publishedOn,
    marketplaceReferences: marketplaceReferences.map((reference) => {
      const persistedReference = setMarketplaceReferenceSelectSchema.parse(reference);
      return {
        marketplace: persistedReference.marketplace,
        externalId: persistedReference.externalId,
      };
    }),
  });
}

export { toDomainCardSet };
