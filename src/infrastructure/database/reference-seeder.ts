import { eq, getTableColumns, sql, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import type { EmptyRelations } from "drizzle-orm";
import type { SQLiteAsyncDatabase, SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import type * as SQLite from "expo-sqlite";

import type { Logger } from "@/application/ports/logger";
import { DrizzleLoggerAdapter } from "@/infrastructure/drizzle/drizzle-logger-adapter";
import { CATALOG_SEED_VERSION, catalogSeed } from "./generated/catalog-seed";
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
import { cardKeywordTargets, cardKeywords, keywords } from "./reference-schema/keywords";
import { catalogSeedStates } from "./reference-schema/seed-state";
import { cardSets, setMarketplaceReferences } from "./reference-schema/sets";
import { cardSupertypes, cardTypes, domains, rarities, tags } from "./reference-schema/taxonomy";

const CATALOG_SEED_STATE_ID = "catalog";
// card_printing is the widest insert (12 columns); 40 rows stays below SQLite's 999-variable limit,
// and an excluded reference in the conflict clause binds no further variable.
const INSERT_BATCH_SIZE = 40;

type ReferenceDatabase<TRunResult> = SQLiteAsyncDatabase<"sync", TRunResult, EmptyRelations>;

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

/** Imports bundled reference data only when its content version changes. */
async function ensureReferenceDataSeeded(
  database: SQLite.SQLiteDatabase,
  logger: Logger,
): Promise<void> {
  const db = drizzle(database, { logger: new DrizzleLoggerAdapter(logger) });
  if (await isSeededAt(db, CATALOG_SEED_VERSION)) return;

  await database.withExclusiveTransactionAsync(async (transaction) => {
    const transactionDb = drizzle(transaction, { logger: new DrizzleLoggerAdapter(logger) });
    await applyReferenceSeed(transactionDb, catalogSeed, CATALOG_SEED_VERSION);
  });
}

async function applyReferenceSeed<TRunResult>(
  db: ReferenceDatabase<TRunResult>,
  seed: CatalogSeed,
  version: string,
): Promise<void> {
  if (await isSeededAt(db, version)) return;

  await clearAssociationData(db);
  await upsertCatalogData(db, seed);
  await insertAssociationData(db, seed);
  await db
    .insert(catalogSeedStates)
    .values({ id: CATALOG_SEED_STATE_ID, version })
    .onConflictDoUpdate({ target: catalogSeedStates.id, set: { version } });
}

async function isSeededAt<TRunResult>(
  db: ReferenceDatabase<TRunResult>,
  version: string,
): Promise<boolean> {
  const [state] = await db
    .select({ version: catalogSeedStates.version })
    .from(catalogSeedStates)
    .where(eq(catalogSeedStates.id, CATALOG_SEED_STATE_ID))
    .limit(1);
  return state?.version === version;
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
  for (const rows of batches(seed.cardTypes)) {
    await db
      .insert(cardTypes)
      .values([...rows])
      .onConflictDoUpdate(replaceOnConflict(cardTypes));
  }
  for (const rows of batches(seed.cardSupertypes)) {
    await db
      .insert(cardSupertypes)
      .values([...rows])
      .onConflictDoUpdate(replaceOnConflict(cardSupertypes));
  }
  for (const rows of batches(seed.rarities)) {
    await db
      .insert(rarities)
      .values([...rows])
      .onConflictDoUpdate(replaceOnConflict(rarities));
  }
  for (const rows of batches(seed.cardSets)) {
    await db
      .insert(cardSets)
      .values([...rows])
      .onConflictDoUpdate(replaceOnConflict(cardSets));
  }
  for (const rows of batches(seed.cards)) {
    await db
      .insert(cards)
      .values([...rows])
      .onConflictDoUpdate(replaceOnConflict(cards));
  }
  for (const rows of batches(seed.cardPrintings)) {
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
  for (const rows of batches(seed.domains)) await db.insert(domains).values([...rows]);
  for (const rows of batches(seed.tags)) await db.insert(tags).values([...rows]);
  for (const rows of batches(seed.keywords)) await db.insert(keywords).values([...rows]);
  for (const rows of batches(seed.setMarketplaceReferences)) {
    await db.insert(setMarketplaceReferences).values([...rows]);
  }
  for (const rows of batches(seed.cardMedia)) await db.insert(cardMedia).values([...rows]);
  for (const rows of batches(seed.cardImageSources)) {
    await db.insert(cardImageSources).values([...rows]);
  }
  for (const rows of batches(seed.cardDomains)) await db.insert(cardDomains).values([...rows]);
  for (const rows of batches(seed.cardTags)) await db.insert(cardTags).values([...rows]);
  for (const rows of batches(seed.cardMarketplaceReferences)) {
    await db.insert(cardMarketplaceReferences).values([...rows]);
  }
  for (const rows of batches(seed.cardKeywords)) await db.insert(cardKeywords).values([...rows]);
  for (const rows of batches(seed.cardKeywordTargets)) {
    await db.insert(cardKeywordTargets).values([...rows]);
  }
  for (const rows of batches(seed.cardSpeeds)) await db.insert(cardSpeeds).values([...rows]);
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

function* batches<Value>(values: readonly Value[]): Generator<readonly Value[]> {
  for (let start = 0; start < values.length; start += INSERT_BATCH_SIZE) {
    yield values.slice(start, start + INSERT_BATCH_SIZE);
  }
}

export { applyReferenceSeed, ensureReferenceDataSeeded };
export type { CatalogSeed };
