import { text, sqliteTable } from "drizzle-orm/sqlite-core";

/** Records the bundled catalog dataset currently materialized in the local database. */
const catalogSeedStates = sqliteTable("catalog_seed_state", {
  id: text().primaryKey(),
  version: text().notNull(),
});

/**
 * Records the bundled core rules dataset currently materialized in the local database. The rules
 * are not cards, so their version lives in a table of its own rather than a second row under the
 * catalog's name.
 */
const coreRulesSeedStates = sqliteTable("core_rules_seed_state", {
  id: text().primaryKey(),
  version: text().notNull(),
});

export { catalogSeedStates, coreRulesSeedStates };
