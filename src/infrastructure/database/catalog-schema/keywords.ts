import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { catalogCards } from "./cards";

const keywords = sqliteTable("keyword", {
  id: text().primaryKey(),
  name: text().notNull().unique(),
  reminderText: text("reminder_text"),
});

const cardKeywords = sqliteTable(
  "card_keyword",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => catalogCards.id),
    keywordId: text("keyword_id")
      .notNull()
      .references(() => keywords.id),
    value: integer(),
    cost: text(),
    reminder: text(),
  },
  (table) => [primaryKey({ columns: [table.cardId, table.keywordId] })],
);

const keywordSelectSchema = createSelectSchema(keywords);
const keywordInsertSchema = createInsertSchema(keywords, {
  id: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1),
});

const cardKeywordSelectSchema = createSelectSchema(cardKeywords);
const cardKeywordInsertSchema = createInsertSchema(cardKeywords, {
  cardId: (schema) => schema.trim().min(1),
  keywordId: (schema) => schema.trim().min(1),
  value: (schema) => schema.int().positive(),
});

export {
  cardKeywordInsertSchema,
  cardKeywordSelectSchema,
  cardKeywords,
  keywordInsertSchema,
  keywordSelectSchema,
  keywords,
};
