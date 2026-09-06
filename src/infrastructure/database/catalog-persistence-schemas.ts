import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import {
  cardClassifications,
  cardDomains,
  cardMarketplaceReferences,
  cardMedia,
  cardSets,
  cardSupertypes,
  cardTags,
  cardTypes,
  catalogCards,
  domains,
  rarities,
  setMarketplaceReferences,
  tags,
} from "./schema";

const marketplaceSchema = z.enum(["cardmarket", "tcgplayer"]);
const cardOrientationSchema = z.enum(["landscape", "portrait"]);

const cardSetSelectSchema = createSelectSchema(cardSets);
const cardSetInsertSchema = createInsertSchema(cardSets, {
  code: (schema) => schema.trim().min(1),
  sourceId: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1),
  declaredCardCount: (schema) => schema.int().nonnegative(),
  publishedOn: (schema) => schema.min(1),
});

const setMarketplaceReferenceSelectSchema = createSelectSchema(setMarketplaceReferences, {
  marketplace: marketplaceSchema,
});
const setMarketplaceReferenceInsertSchema = createInsertSchema(setMarketplaceReferences, {
  marketplace: marketplaceSchema,
});

const catalogCardSelectSchema = createSelectSchema(catalogCards, {
  orientation: cardOrientationSchema,
});
const catalogCardInsertSchema = createInsertSchema(catalogCards, {
  id: (schema) => schema.trim().min(1),
  riftboundId: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1),
  cleanName: (schema) => schema.trim().min(1),
  orientation: cardOrientationSchema,
  energy: (schema) => schema.int().nonnegative().nullable(),
  might: (schema) => schema.int().nonnegative().nullable(),
  power: (schema) => schema.int().nonnegative().nullable(),
});

const cardMarketplaceReferenceSelectSchema = createSelectSchema(cardMarketplaceReferences, {
  marketplace: marketplaceSchema,
});
const cardMarketplaceReferenceInsertSchema = createInsertSchema(cardMarketplaceReferences, {
  marketplace: marketplaceSchema,
});

const cardMediaSelectSchema = createSelectSchema(cardMedia);
const cardMediaInsertSchema = createInsertSchema(cardMedia, {
  imageAssetId: (schema) => schema.trim().min(1),
});

const cardTypeSelectSchema = createSelectSchema(cardTypes);
const cardTypeInsertSchema = createInsertSchema(cardTypes, {
  id: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1),
});

const cardSupertypeSelectSchema = createSelectSchema(cardSupertypes);
const cardSupertypeInsertSchema = createInsertSchema(cardSupertypes, {
  id: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1),
});

const raritySelectSchema = createSelectSchema(rarities);
const rarityInsertSchema = createInsertSchema(rarities, {
  id: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1),
  sortOrder: (schema) => schema.int().nonnegative(),
});

const cardClassificationSelectSchema = createSelectSchema(cardClassifications);
const cardClassificationInsertSchema = createInsertSchema(cardClassifications);

const domainSelectSchema = createSelectSchema(domains);
const domainInsertSchema = createInsertSchema(domains, {
  id: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1),
});

const cardDomainSelectSchema = createSelectSchema(cardDomains);
const cardDomainInsertSchema = createInsertSchema(cardDomains);

const tagSelectSchema = createSelectSchema(tags);
const tagInsertSchema = createInsertSchema(tags, {
  id: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1),
});

const cardTagSelectSchema = createSelectSchema(cardTags);
const cardTagInsertSchema = createInsertSchema(cardTags);

export {
  cardClassificationInsertSchema,
  cardClassificationSelectSchema,
  cardDomainInsertSchema,
  cardDomainSelectSchema,
  cardMarketplaceReferenceInsertSchema,
  cardMarketplaceReferenceSelectSchema,
  cardMediaInsertSchema,
  cardMediaSelectSchema,
  cardOrientationSchema,
  cardSetInsertSchema,
  cardSetSelectSchema,
  cardSupertypeInsertSchema,
  cardSupertypeSelectSchema,
  cardTagInsertSchema,
  cardTagSelectSchema,
  cardTypeInsertSchema,
  cardTypeSelectSchema,
  catalogCardInsertSchema,
  catalogCardSelectSchema,
  domainInsertSchema,
  domainSelectSchema,
  marketplaceSchema,
  rarityInsertSchema,
  raritySelectSchema,
  setMarketplaceReferenceInsertSchema,
  setMarketplaceReferenceSelectSchema,
  tagInsertSchema,
  tagSelectSchema,
};
