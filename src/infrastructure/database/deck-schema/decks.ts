import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { deckSectionSchema } from "@/features/deck/deck/deck";

/** Locally-created deck metadata. Accounts and ownership are intentionally out of scope. */
const decks = sqliteTable(
  "deck",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    notes: text().notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("deck_updated_at").on(table.updatedAt)],
);

/**
 * Aggregates a card's quantity within one deck section. `cardRiftboundId` is intentionally not a
 * foreign key: catalog reseeds may replace catalog rows, but must never alter saved deck entries.
 */
const deckCards = sqliteTable(
  "deck_card",
  {
    deckId: text("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    section: text().notNull(),
    cardRiftboundId: text("card_riftbound_id").notNull(),
    quantity: integer().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.deckId, table.section, table.cardRiftboundId] }),
    check("deck_card_quantity_positive", sql`${table.quantity} > 0`),
    index("deck_card_riftbound_id").on(table.cardRiftboundId),
  ],
);

const deckSelectSchema = createSelectSchema(decks);
const deckInsertSchema = createInsertSchema(decks, {
  id: (schema) => schema.trim().min(1),
  name: (schema) => schema.trim().min(1),
  notes: (schema) => schema,
  createdAt: (schema) => schema.trim().min(1),
  updatedAt: (schema) => schema.trim().min(1),
});
const deckCardSelectSchema = createSelectSchema(deckCards, {
  section: deckSectionSchema,
});
const deckCardInsertSchema = createInsertSchema(deckCards, {
  deckId: (schema) => schema.trim().min(1),
  section: deckSectionSchema,
  cardRiftboundId: (schema) => schema.trim().min(1),
  quantity: (schema) => schema.int().positive(),
});

export {
  deckCardInsertSchema,
  deckCardSelectSchema,
  deckCards,
  deckInsertSchema,
  deckSectionSchema,
  deckSelectSchema,
  decks,
};
