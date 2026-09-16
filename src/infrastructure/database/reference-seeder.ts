import { eq, getTableColumns, sql, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import type { EmptyRelations } from "drizzle-orm";
import type { SQLiteAsyncDatabase, SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import type * as SQLite from "expo-sqlite";

import type { Logger } from "@/application/ports/logger";
import { DrizzleLoggerAdapter } from "@/infrastructure/drizzle/drizzle-logger-adapter";
import { CATALOG_SEED_VERSION, catalogSeed } from "./generated/catalog-seed";
import { CORE_RULES_SEED_VERSION, coreRulesSeed } from "./generated/core-rules-seed";
import {
  cardDomains,
  cardImageSources,
  cardMarketplaceReferences,
  cardMedia,
  cardPrintings,
  cardSpeeds,
  cardTags,
  cards,
} from "./reference-schema/cards";
import { coreRuleDetails, coreRules, coreRulesEditions } from "./reference-schema/core-rules";
import { cardKeywordTargets, cardKeywords, keywords } from "./reference-schema/keywords";
import { catalogSeedStates, coreRulesSeedStates } from "./reference-schema/seed-state";
import { cardSets, setMarketplaceReferences } from "./reference-schema/sets";
import { cardSupertypes, cardTypes, domains, rarities, tags } from "./reference-schema/taxonomy";

const CATALOG_SEED_STATE_ID = "catalog";
const CORE_RULES_SEED_STATE_ID = "core-rules";
// card_printing is the widest insert (12 columns); 40 rows stays below SQLite's 999-variable limit,
// and an excluded reference in the conflict clause binds no further variable.
const CATALOG_INSERT_BATCH_SIZE = 40;
// core_rule is the widest core rules insert (5 columns), so 180 rows bind 900 variables and
// core_rule_detail's 4 columns bind 720 — both below the same 999-variable limit.
const CORE_RULES_INSERT_BATCH_SIZE = 180;

type ReferenceDatabase<TRunResult> = SQLiteAsyncDatabase<"sync", TRunResult, EmptyRelations>;

type SeedStateTable = typeof catalogSeedStates | typeof coreRulesSeedStates;

type CatalogSeed = {
  readonly cardTypes: readonly (typeof cardTypes.$inferInsert)[];
  readonly cardSupertypes: readonly (typeof cardSupertypes.$inferInsert)[];
  readonly rarities: readonly (typeof rarities.$inferInsert)[];
  readonly cardSets: readonly (typeof cardSets.$inferInsert)[];
  readonly cards: readonly (typeof cards.$inferInsert)[];
  readonly cardPrintings: readonly (typeof cardPrintings.$inferInsert)[];
  readonly domains: readonly (typeof domains.$inferInsert)[];
  readonly tags: readonly (typeof tags.$inferInsert)[];
  readonly keywords: readonly (typeof keywords.$inferInsert)[];
  readonly setMarketplaceReferences: readonly (typeof setMarketplaceReferences.$inferInsert)[];
  readonly cardMedia: readonly (typeof cardMedia.$inferInsert)[];
  readonly cardImageSources: readonly (typeof cardImageSources.$inferInsert)[];
  readonly cardDomains: readonly (typeof cardDomains.$inferInsert)[];
  readonly cardTags: readonly (typeof cardTags.$inferInsert)[];
  readonly cardMarketplaceReferences: readonly (typeof cardMarketplaceReferences.$inferInsert)[];
  readonly cardKeywords: readonly (typeof cardKeywords.$inferInsert)[];
  readonly cardKeywordTargets: readonly (typeof cardKeywordTargets.$inferInsert)[];
  readonly cardSpeeds: readonly (typeof cardSpeeds.$inferInsert)[];
};

type CoreRulesSeed = {
  readonly coreRulesEditions: readonly (typeof coreRulesEditions.$inferInsert)[];
  readonly coreRules: readonly (typeof coreRules.$inferInsert)[];
  readonly coreRuleDetails: readonly (typeof coreRuleDetails.$inferInsert)[];
};

/** Imports the bundled card catalog only when its content version changes. */
async function ensureCatalogSeeded(database: SQLite.SQLiteDatabase, logger: Logger): Promise<void> {
  const db = drizzle(database, { logger: new DrizzleLoggerAdapter(logger) });
  if (await isSeededAt(db, catalogSeedStates, CATALOG_SEED_STATE_ID, CATALOG_SEED_VERSION)) return;

  await database.withExclusiveTransactionAsync(async (transaction) => {
    const transactionDb = drizzle(transaction, { logger: new DrizzleLoggerAdapter(logger) });
    await applyCatalogSeed(transactionDb, catalogSeed, CATALOG_SEED_VERSION);
  });
}

/** Imports the bundled core rules only when their content version changes. */
async function ensureCoreRulesSeeded(
  database: SQLite.SQLiteDatabase,
  logger: Logger,
): Promise<void> {
  const db = drizzle(database, { logger: new DrizzleLoggerAdapter(logger) });
  const seeded = await isSeededAt(
    db,
    coreRulesSeedStates,
    CORE_RULES_SEED_STATE_ID,
    CORE_RULES_SEED_VERSION,
  );
  if (seeded) return;

  await database.withExclusiveTransactionAsync(async (transaction) => {
    const transactionDb = drizzle(transaction, { logger: new DrizzleLoggerAdapter(logger) });
    await applyCoreRulesSeed(transactionDb, coreRulesSeed, CORE_RULES_SEED_VERSION);
  });
}

async function applyCatalogSeed<TRunResult>(
  db: ReferenceDatabase<TRunResult>,
  seed: CatalogSeed,
  version: string,
): Promise<void> {
  if (await isSeededAt(db, catalogSeedStates, CATALOG_SEED_STATE_ID, version)) return;

  await clearAssociationData(db);
  await upsertCatalogData(db, seed);
  await insertAssociationData(db, seed);
  await recordSeedState(db, catalogSeedStates, CATALOG_SEED_STATE_ID, version);
}

/**
 * Replaces the whole document, child rows first. No user row references a core rule, so there is
 * nothing here to preserve the way a card a later catalog drops is preserved.
 */
async function applyCoreRulesSeed<TRunResult>(
  db: ReferenceDatabase<TRunResult>,
  seed: CoreRulesSeed,
  version: string,
): Promise<void> {
  if (await isSeededAt(db, coreRulesSeedStates, CORE_RULES_SEED_STATE_ID, version)) return;

  await db.delete(coreRuleDetails);
  await db.delete(coreRules);
  await db.delete(coreRulesEditions);

  for (const rows of batches(seed.coreRulesEditions, CORE_RULES_INSERT_BATCH_SIZE)) {
    await db.insert(coreRulesEditions).values([...rows]);
  }
  // Document order puts a parent before every child, which is what lets parent_number resolve
  // while the foreign key is enforced row by row.
  for (const rows of batches(seed.coreRules, CORE_RULES_INSERT_BATCH_SIZE)) {
    await db.insert(coreRules).values([...rows]);
  }
  for (const rows of batches(seed.coreRuleDetails, CORE_RULES_INSERT_BATCH_SIZE)) {
    await db.insert(coreRuleDetails).values([...rows]);
  }

  await recordSeedState(db, coreRulesSeedStates, CORE_RULES_SEED_STATE_ID, version);
}

async function isSeededAt<TRunResult>(
  db: ReferenceDatabase<TRunResult>,
  table: SeedStateTable,
  id: string,
  version: string,
): Promise<boolean> {
  const [state] = await db
    .select({ version: table.version })
    .from(table)
    .where(eq(table.id, id))
    .limit(1);
  return state?.version === version;
}

async function recordSeedState<TRunResult>(
  db: ReferenceDatabase<TRunResult>,
  table: SeedStateTable,
  id: string,
  version: string,
): Promise<void> {
  await db
    .insert(table)
    .values({ id, version })
    .onConflictDoUpdate({ target: table.id, set: { version } });
}

async function clearAssociationData<TRunResult>(db: ReferenceDatabase<TRunResult>): Promise<void> {
  await db.delete(cardTags);
  await db.delete(cardDomains);
  await db.delete(cardMarketplaceReferences);
  await db.delete(cardMedia);
  await db.delete(cardImageSources);
  await db.delete(cardKeywordTargets);
  await db.delete(cardKeywords);
  await db.delete(cardSpeeds);
  await db.delete(keywords);
  await db.delete(setMarketplaceReferences);
  await db.delete(tags);
  await db.delete(domains);
}

async function upsertCatalogData<TRunResult>(
  db: ReferenceDatabase<TRunResult>,
  seed: CatalogSeed,
): Promise<void> {
  for (const rows of catalogBatches(seed.cardTypes)) {
    await db
      .insert(cardTypes)
      .values([...rows])
      .onConflictDoUpdate(replaceOnConflict(cardTypes));
  }
  for (const rows of catalogBatches(seed.cardSupertypes)) {
    await db
      .insert(cardSupertypes)
      .values([...rows])
      .onConflictDoUpdate(replaceOnConflict(cardSupertypes));
  }
  for (const rows of catalogBatches(seed.rarities)) {
    await db
      .insert(rarities)
      .values([...rows])
      .onConflictDoUpdate(replaceOnConflict(rarities));
  }
  for (const rows of catalogBatches(seed.cardSets)) {
    await db
      .insert(cardSets)
      .values([...rows])
      .onConflictDoUpdate(replaceOnConflict(cardSets));
  }
  for (const rows of catalogBatches(seed.cards)) {
    await db
      .insert(cards)
      .values([...rows])
      .onConflictDoUpdate(replaceOnConflict(cards));
  }
  for (const rows of catalogBatches(seed.cardPrintings)) {
    await db
      .insert(cardPrintings)
      .values([...rows])
      .onConflictDoUpdate(replaceOnConflict(cardPrintings));
  }
}

async function insertAssociationData<TRunResult>(
  db: ReferenceDatabase<TRunResult>,
  seed: CatalogSeed,
): Promise<void> {
  for (const rows of catalogBatches(seed.domains)) await db.insert(domains).values([...rows]);
  for (const rows of catalogBatches(seed.tags)) await db.insert(tags).values([...rows]);
  for (const rows of catalogBatches(seed.keywords)) await db.insert(keywords).values([...rows]);
  for (const rows of catalogBatches(seed.setMarketplaceReferences)) {
    await db.insert(setMarketplaceReferences).values([...rows]);
  }
  for (const rows of catalogBatches(seed.cardMedia)) await db.insert(cardMedia).values([...rows]);
  for (const rows of catalogBatches(seed.cardImageSources)) {
    await db.insert(cardImageSources).values([...rows]);
  }
  for (const rows of catalogBatches(seed.cardDomains)) {
    await db.insert(cardDomains).values([...rows]);
  }
  for (const rows of catalogBatches(seed.cardTags)) await db.insert(cardTags).values([...rows]);
  for (const rows of catalogBatches(seed.cardMarketplaceReferences)) {
    await db.insert(cardMarketplaceReferences).values([...rows]);
  }
  for (const rows of catalogBatches(seed.cardKeywords)) {
    await db.insert(cardKeywords).values([...rows]);
  }
  for (const rows of catalogBatches(seed.cardKeywordTargets)) {
    await db.insert(cardKeywordTargets).values([...rows]);
  }
  for (const rows of catalogBatches(seed.cardSpeeds)) await db.insert(cardSpeeds).values([...rows]);
}

function replaceOnConflict(table: SQLiteTable): {
  target: SQLiteColumn[];
  set: Record<string, SQL>;
} {
  const columns = Object.entries(getTableColumns(table));
  return {
    target: columns.filter(([, column]) => column.primary).map(([, column]) => column),
    set: Object.fromEntries(
      columns
        .filter(([, column]) => !column.primary)
        .map(([property, column]) => [property, sql`excluded.${sql.identifier(column.name)}`]),
    ),
  };
}

function catalogBatches<Value>(values: readonly Value[]): Generator<readonly Value[]> {
  return batches(values, CATALOG_INSERT_BATCH_SIZE);
}

function* batches<Value>(values: readonly Value[], size: number): Generator<readonly Value[]> {
  for (let start = 0; start < values.length; start += size) {
    yield values.slice(start, start + size);
  }
}

export { applyCatalogSeed, applyCoreRulesSeed, ensureCatalogSeeded, ensureCoreRulesSeeded };
export type { CatalogSeed, CoreRulesSeed };
