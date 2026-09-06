import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Catalog tables persist individual card printings and their related data. */
const cardSets = sqliteTable(
  "card_set",
  {
    code: text().primaryKey(),
    sourceId: text("source_id").notNull().unique(),
    name: text().notNull(),
    declaredCardCount: integer("declared_card_count").notNull(),
    publishedOn: text("published_on").notNull(),
  },
  (table) => [index("card_set_published_on").on(table.publishedOn)],
);

const setMarketplaceReferences = sqliteTable(
  "set_marketplace_reference",
  {
    setCode: text("set_code")
      .notNull()
      .references(() => cardSets.code),
    marketplace: text().notNull(),
    externalId: text("external_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.setCode, table.marketplace, table.externalId] }),
    index("set_marketplace_reference_lookup").on(table.marketplace, table.externalId),
  ],
);

const catalogCards = sqliteTable(
  "catalog_card",
  {
    id: text().primaryKey(),
    riftboundId: text("riftbound_id").notNull().unique(),
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
    sourceUpdatedAt: text("source_updated_at").notNull(),
  },
  (table) => [
    index("card_set_collector_number").on(table.setCode, table.collectorNumber),
    index("card_clean_name").on(table.cleanName),
  ],
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
  artist: text(),
  accessibilityText: text("accessibility_text"),
});

const cardTypes = sqliteTable("card_type", {
  id: text().primaryKey(),
  name: text().notNull().unique(),
});

const cardSupertypes = sqliteTable("card_supertype", {
  id: text().primaryKey(),
  name: text().notNull().unique(),
});

const rarities = sqliteTable("rarity", {
  id: text().primaryKey(),
  name: text().notNull().unique(),
  sortOrder: integer("sort_order").notNull(),
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

const domains = sqliteTable("domain", {
  id: text().primaryKey(),
  name: text().notNull().unique(),
});

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

const tags = sqliteTable("tag", {
  id: text().primaryKey(),
  name: text().notNull().unique(),
});

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

export {
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
};
