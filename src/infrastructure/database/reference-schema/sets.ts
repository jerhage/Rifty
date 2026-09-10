import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";

const marketplaceSchema = z.enum(["cardmarket", "tcgplayer"]);

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

export {
  cardSetInsertSchema,
  cardSetSelectSchema,
  cardSets,
  marketplaceSchema,
  setMarketplaceReferenceInsertSchema,
  setMarketplaceReferenceSelectSchema,
  setMarketplaceReferences,
};
