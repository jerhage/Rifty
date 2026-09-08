import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";

import { cardSets, marketplaceSchema } from "./sets";
import { cardSupertypes, cardTypes, domains, rarities, tags } from "./taxonomy";

const cardOrientationSchema = z.enum(["landscape", "portrait"]);
const cardSpeedSchema = z.enum(["normal", "action", "reaction"]);

/** Catalog tables persist individual card printings and their related data. */
const catalogCards = sqliteTable(
  "catalog_card",
  {
    id: text().primaryKey(),
    // A Riftbound ID identifies a card face; multiple printings can share it.
    riftboundId: text("riftbound_id").notNull(),
    setCode: text("set_code")
      .notNull()
      .references(() => cardSets.code),
    collectorNumber: integer("collector_number").notNull(),
    name: text().notNull(),
    cleanName: text("clean_name").notNull(),
    energy: integer(),
    might: integer(),
    power: integer(),
    rulesTextRich: text("rules_text_rich").notNull(),
    rulesTextPlain: text("rules_text_plain").notNull(),
    flavourText: text("flavour_text"),
    orientation: text().notNull(),
    isAlternateArt: integer("is_alternate_art", { mode: "boolean" }).notNull(),
    isOvernumbered: integer("is_overnumbered", { mode: "boolean" }).notNull(),
    isSignature: integer("is_signature", { mode: "boolean" }).notNull(),
    poolCode: text("pool_code"),
    championName: text("champion_name"),
    isCanonical: integer("is_canonical", { mode: "boolean" }).notNull().default(true),
    sourceUpdatedAt: text("source_updated_at").notNull(),
  },
  (table) => [
    index("card_set_collector_number").on(table.setCode, table.collectorNumber),
    index("card_clean_name").on(table.cleanName),
    index("catalog_card_riftbound_id").on(table.riftboundId),
    index("catalog_card_champion_name").on(table.championName),
    index("catalog_card_pool_code").on(table.poolCode),
  ],
);

const cardSpeeds = sqliteTable(
  "card_speed",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => catalogCards.id),
    speed: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.cardId, table.speed] })],
);

const cardMarketplaceReferences = sqliteTable(
  "card_marketplace_reference",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => catalogCards.id),
    marketplace: text().notNull(),
    externalId: text("external_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.cardId, table.marketplace, table.externalId] }),
    index("card_marketplace_reference_lookup").on(table.marketplace, table.externalId),
  ],
);

const cardMedia = sqliteTable("card_media", {
  cardId: text("card_id")
    .primaryKey()
    .references(() => catalogCards.id),
  imageAssetId: text("image_asset_id").notNull(),
  imageWidth: integer("image_width").notNull(),
  imageHeight: integer("image_height").notNull(),
  artist: text(),
  accessibilityText: text("accessibility_text"),
});

const cardClassifications = sqliteTable(
  "card_classification",
  {
    cardId: text("card_id")
      .primaryKey()
      .references(() => catalogCards.id),
    typeId: text("type_id")
      .notNull()
      .references(() => cardTypes.id),
    supertypeId: text("supertype_id").references(() => cardSupertypes.id),
    rarityId: text("rarity_id")
      .notNull()
      .references(() => rarities.id),
  },
  (table) => [index("card_classification_type_rarity").on(table.typeId, table.rarityId)],
);

const cardDomains = sqliteTable(
  "card_domain",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => catalogCards.id),
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id),
  },
  (table) => [
    primaryKey({ columns: [table.cardId, table.domainId] }),
    index("card_domain_domain_id").on(table.domainId),
  ],
);

const cardTags = sqliteTable(
  "card_tag",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => catalogCards.id),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id),
  },
  (table) => [
    primaryKey({ columns: [table.cardId, table.tagId] }),
    index("card_tag_tag_id").on(table.tagId),
  ],
);

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
  imageWidth: (schema) => schema.int().positive(),
  imageHeight: (schema) => schema.int().positive(),
});

const cardClassificationSelectSchema = createSelectSchema(cardClassifications);
const cardClassificationInsertSchema = createInsertSchema(cardClassifications);
const cardDomainSelectSchema = createSelectSchema(cardDomains);
const cardDomainInsertSchema = createInsertSchema(cardDomains);
const cardTagSelectSchema = createSelectSchema(cardTags);
const cardTagInsertSchema = createInsertSchema(cardTags);
const cardSpeedSelectSchema = createSelectSchema(cardSpeeds, { speed: cardSpeedSchema });
const cardSpeedInsertSchema = createInsertSchema(cardSpeeds, {
  cardId: (schema) => schema.trim().min(1),
  speed: cardSpeedSchema,
});

export {
  cardClassificationInsertSchema,
  cardClassificationSelectSchema,
  cardClassifications,
  cardDomainInsertSchema,
  cardDomainSelectSchema,
  cardDomains,
  cardMarketplaceReferenceInsertSchema,
  cardMarketplaceReferenceSelectSchema,
  cardMarketplaceReferences,
  cardMedia,
  cardMediaInsertSchema,
  cardMediaSelectSchema,
  cardOrientationSchema,
  cardSpeedInsertSchema,
  cardSpeedSchema,
  cardSpeedSelectSchema,
  cardSpeeds,
  cardTagInsertSchema,
  cardTagSelectSchema,
  cardTags,
  catalogCardInsertSchema,
  catalogCardSelectSchema,
  catalogCards,
};
