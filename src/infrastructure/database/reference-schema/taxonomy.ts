import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";

const tagKindSchema = z.enum(["character", "region", "trait"]);

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

const domains = sqliteTable("domain", {
  id: text().primaryKey(),
  name: text().notNull().unique(),
});

const tags = sqliteTable("tag", {
  id: text().primaryKey(),
  name: text().notNull().unique(),
  kind: text().notNull().default("trait"),
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

const domainSelectSchema = createSelectSchema(domains);
const domainInsertSchema = createInsertSchema(domains, {
  id: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1),
});

const tagSelectSchema = createSelectSchema(tags);
const tagInsertSchema = createInsertSchema(tags, {
  id: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1),
  kind: tagKindSchema,
});

export {
  cardSupertypeInsertSchema,
  cardSupertypeSelectSchema,
  cardSupertypes,
  cardTypeInsertSchema,
  cardTypeSelectSchema,
  cardTypes,
  domainInsertSchema,
  domainSelectSchema,
  domains,
  rarities,
  rarityInsertSchema,
  raritySelectSchema,
  tagInsertSchema,
  tagKindSchema,
  tagSelectSchema,
  tags,
};
