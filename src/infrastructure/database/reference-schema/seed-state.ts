import { text, sqliteTable } from "drizzle-orm/sqlite-core";

/** Records the bundled catalog dataset currently materialized in the local database. */
const catalogSeedStates = sqliteTable("catalog_seed_state", {
  id: text().primaryKey(),
  version: text().notNull(),
});

export { catalogSeedStates };
