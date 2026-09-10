import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";

import { cardSpeedSchema } from "../../../features/card/value-objects/card-speed";

import { cardSets, marketplaceSchema } from "./sets";
import { cardSupertypes, cardTypes, domains, rarities, tags } from "./taxonomy";

const cardOrientationSchema = z.enum(["landscape", "portrait"]);

/** Card rows hold gameplay identity; printing rows hold one released manifestation of it. */
const cards = sqliteTable(
  "card",
  {
    id: text().primaryKey(),
    cleanName: text("clean_name").notNull(),
    energy: integer(),
    might: integer(),
    power: integer(),
    rulesTextRich: text("rules_text_rich").notNull(),
    rulesTextPlain: text("rules_text_plain").notNull(),
    orientation: text().notNull(),
    typeId: text("type_id")
      .notNull()
      .references(() => cardTypes.id),
    supertypeId: text("supertype_id").references(() => cardSupertypes.id),
    championName: text("champion_name"),
  },
  (table) => [
    index("card_clean_name").on(table.cleanName),
    index("card_champion_name").on(table.championName),
    index("card_type_id").on(table.typeId),
  ],
);

const cardPrintings = sqliteTable(
  "card_printing",
  {
    id: text().primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id),
    // A Riftbound ID identifies a card face; multiple printings can share it.
    riftboundId: text("riftbound_id").notNull(),
    setCode: text("set_code")
      .notNull()
      .references(() => cardSets.code),
    collectorNumber: integer("collector_number").notNull(),
    poolCode: text("pool_code"),
    rarityId: text("rarity_id")
      .notNull()
      .references(() => rarities.id),
    printedName: text("printed_name").notNull(),
    isAlternateArt: integer("is_alternate_art", { mode: "boolean" }).notNull(),
    isOvernumbered: integer("is_overnumbered", { mode: "boolean" }).notNull(),
    isSignature: integer("is_signature", { mode: "boolean" }).notNull(),
    flavourText: text("flavour_text"),
    sourceUpdatedAt: text("source_updated_at").notNull(),
    isCanonical: integer("is_canonical", { mode: "boolean" }).notNull().default(true),
  },
  (table) => [
    index("card_printing_card_id").on(table.cardId),
    index("card_printing_set_collector_number").on(table.setCode, table.collectorNumber),
    index("card_printing_riftbound_id").on(table.riftboundId),
    index("card_printing_pool_code").on(table.poolCode),
    index("card_printing_rarity_id").on(table.rarityId),
  ],
);

const cardSpeeds = sqliteTable(
  "card_speed",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id),
    speed: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.cardId, table.speed] })],
);

const cardMarketplaceReferences = sqliteTable(
  "card_marketplace_reference",
  {
    printingId: text("printing_id")
      .notNull()
      .references(() => cardPrintings.id),
    marketplace: text().notNull(),
    externalId: text("external_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.printingId, table.marketplace, table.externalId] }),
    index("card_marketplace_reference_lookup").on(table.marketplace, table.externalId),
  ],
);

const cardMedia = sqliteTable("card_media", {
  printingId: text("printing_id")
    .primaryKey()
    .references(() => cardPrintings.id),
  imageFile: text("image_file").notNull().default(""),
  artist: text(),
  accessibilityText: text("accessibility_text"),
});

const cardImageSources = sqliteTable(
  "card_image_source",
  {
    printingId: text("printing_id")
      .notNull()
      .references(() => cardPrintings.id),
    url: text().notNull(),
    priority: integer().notNull(),
  },
  (table) => [primaryKey({ columns: [table.printingId, table.url] })],
);

const cardDomains = sqliteTable(
  "card_domain",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id),
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
      .references(() => cards.id),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id),
  },
  (table) => [
    primaryKey({ columns: [table.cardId, table.tagId] }),
    index("card_tag_tag_id").on(table.tagId),
  ],
);

const cardSelectSchema = createSelectSchema(cards, {
  orientation: cardOrientationSchema,
});
const cardInsertSchema = createInsertSchema(cards, {
  id: (schema) => schema.trim().min(1),
  cleanName: (schema) => schema.trim().min(1),
  orientation: cardOrientationSchema,
  energy: (schema) => schema.int().nonnegative().nullable(),
  might: (schema) => schema.int().nonnegative().nullable(),
  power: (schema) => schema.int().nonnegative().nullable(),
  typeId: (schema) => schema.trim().min(1),
  supertypeId: (schema) => schema.trim().min(1).nullable(),
});

const cardPrintingSelectSchema = createSelectSchema(cardPrintings);
const cardPrintingInsertSchema = createInsertSchema(cardPrintings, {
  id: (schema) => schema.trim().min(1),
  cardId: (schema) => schema.trim().min(1),
  riftboundId: (schema) => schema.trim().min(1),
  rarityId: (schema) => schema.trim().min(1),
  printedName: (schema) => schema.trim().min(1),
  collectorNumber: (schema) => schema.int().nonnegative(),
});

const cardMarketplaceReferenceSelectSchema = createSelectSchema(cardMarketplaceReferences, {
  marketplace: marketplaceSchema,
});
const cardMarketplaceReferenceInsertSchema = createInsertSchema(cardMarketplaceReferences, {
  marketplace: marketplaceSchema,
});

const cardMediaSelectSchema = createSelectSchema(cardMedia);
const cardMediaInsertSchema = createInsertSchema(cardMedia, {
  imageFile: (schema) => schema.trim().min(1),
});

const cardDomainSelectSchema = createSelectSchema(cardDomains);
const cardDomainInsertSchema = createInsertSchema(cardDomains);
const cardTagSelectSchema = createSelectSchema(cardTags);
const cardTagInsertSchema = createInsertSchema(cardTags);
const cardImageSourceSelectSchema = createSelectSchema(cardImageSources);
const cardImageSourceInsertSchema = createInsertSchema(cardImageSources, {
  printingId: (schema) => schema.trim().min(1),
  url: (schema) => schema.trim().min(1),
  priority: (schema) => schema.int().nonnegative(),
});
const cardSpeedSelectSchema = createSelectSchema(cardSpeeds, { speed: cardSpeedSchema });
const cardSpeedInsertSchema = createInsertSchema(cardSpeeds, {
  cardId: (schema) => schema.trim().min(1),
  speed: cardSpeedSchema,
});

export {
  cardDomainInsertSchema,
  cardDomainSelectSchema,
  cardDomains,
  cardImageSourceInsertSchema,
  cardImageSourceSelectSchema,
  cardImageSources,
  cardInsertSchema,
  cardMarketplaceReferenceInsertSchema,
  cardMarketplaceReferenceSelectSchema,
  cardMarketplaceReferences,
  cardMedia,
  cardMediaInsertSchema,
  cardMediaSelectSchema,
  cardOrientationSchema,
  cardPrintingInsertSchema,
  cardPrintingSelectSchema,
  cardPrintings,
  cardSelectSchema,
  cardSpeedInsertSchema,
  cardSpeedSelectSchema,
  cardSpeeds,
  cardTagInsertSchema,
  cardTagSelectSchema,
  cardTags,
  cards,
};
