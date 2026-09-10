import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { keywordAllegianceSchema } from "../../../features/card/value-objects/keyword-allegiance";
import { keywordTargetKindSchema } from "../../../features/card/value-objects/keyword-target-kind";
import { catalogCards } from "./cards";

const keywords = sqliteTable("keyword", {
  id: text().primaryKey(),
  name: text().notNull().unique(),
  reminderText: text("reminder_text"),
});

const cardKeywords = sqliteTable("card_keyword", {
  id: integer().primaryKey(),
  cardId: text("card_id")
    .notNull()
    .references(() => catalogCards.id),
  keywordId: text("keyword_id")
    .notNull()
    .references(() => keywords.id),
  value: integer(),
  cost: text(),
  reminder: text(),
  source: text().notNull().default("derived"),
});

const cardKeywordTargets = sqliteTable(
  "card_keyword_target",
  {
    cardKeywordId: integer("card_keyword_id")
      .notNull()
      .references(() => cardKeywords.id),
    targetKind: text("target_kind").notNull().default("self"),
    targetIsToken: integer("target_is_token", { mode: "boolean" }).notNull().default(false),
    allegiance: text().notNull().default("unspecified"),
  },
  (table) => [
    primaryKey({
      columns: [table.cardKeywordId, table.targetKind, table.targetIsToken, table.allegiance],
    }),
  ],
);

const keywordSelectSchema = createSelectSchema(keywords);
const keywordInsertSchema = createInsertSchema(keywords, {
  id: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1),
});

const cardKeywordSelectSchema = createSelectSchema(cardKeywords);
const cardKeywordInsertSchema = createInsertSchema(cardKeywords, {
  id: (schema) => schema.int().positive(),
  cardId: (schema) => schema.trim().min(1),
  keywordId: (schema) => schema.trim().min(1),
  value: (schema) => schema.int().positive(),
  source: (schema) => schema.trim().min(1),
});

const cardKeywordTargetSelectSchema = createSelectSchema(cardKeywordTargets, {
  targetKind: keywordTargetKindSchema,
  allegiance: keywordAllegianceSchema,
});
const cardKeywordTargetInsertSchema = createInsertSchema(cardKeywordTargets, {
  cardKeywordId: (schema) => schema.int().positive(),
  targetKind: keywordTargetKindSchema,
  allegiance: keywordAllegianceSchema,
});

export {
  cardKeywordInsertSchema,
  cardKeywordSelectSchema,
  cardKeywordTargetInsertSchema,
  cardKeywordTargetSelectSchema,
  cardKeywordTargets,
  cardKeywords,
  keywordInsertSchema,
  keywordSelectSchema,
  keywords,
};
