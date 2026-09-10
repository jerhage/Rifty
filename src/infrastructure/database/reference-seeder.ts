import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
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
// card_printing is the widest insert (14 columns); 40 rows stays below SQLite's 999-variable limit.
const INSERT_BATCH_SIZE = 40;

/** Imports bundled reference data only when its content version changes. */
async function ensureReferenceDataSeeded(
  database: SQLite.SQLiteDatabase,
  logger: Logger,
): Promise<void> {
  const db = drizzle(database, { logger: new DrizzleLoggerAdapter(logger) });
  const [state] = await db
    .select({ version: catalogSeedStates.version })
    .from(catalogSeedStates)
    .where(eq(catalogSeedStates.id, CATALOG_SEED_STATE_ID))
    .limit(1);
  if (state?.version === CATALOG_SEED_VERSION) return;

  await database.withExclusiveTransactionAsync(async (transaction) => {
    const transactionDb = drizzle(transaction, { logger: new DrizzleLoggerAdapter(logger) });
    const [currentState] = await transactionDb
      .select({ version: catalogSeedStates.version })
      .from(catalogSeedStates)
      .where(eq(catalogSeedStates.id, CATALOG_SEED_STATE_ID))
      .limit(1);
    if (currentState?.version === CATALOG_SEED_VERSION) return;

    await clearReferenceData(transactionDb);
    await insertReferenceData(transactionDb);
    await transactionDb
      .insert(catalogSeedStates)
      .values({ id: CATALOG_SEED_STATE_ID, version: CATALOG_SEED_VERSION })
      .onConflictDoUpdate({ target: catalogSeedStates.id, set: { version: CATALOG_SEED_VERSION } });
  });
}

async function clearReferenceData(db: ReturnType<typeof drizzle>): Promise<void> {
  await db.delete(cardTags);
  await db.delete(cardDomains);
  await db.delete(cardMarketplaceReferences);
  await db.delete(cardMedia);
  await db.delete(cardImageSources);
  await db.delete(cardKeywordTargets);
  await db.delete(cardKeywords);
  await db.delete(cardSpeeds);
  await db.delete(cardPrintings);
  await db.delete(cards);
  await db.delete(keywords);
  await db.delete(setMarketplaceReferences);
  await db.delete(cardSets);
  await db.delete(tags);
  await db.delete(domains);
  await db.delete(rarities);
  await db.delete(cardSupertypes);
  await db.delete(cardTypes);
}

async function insertReferenceData(db: ReturnType<typeof drizzle>): Promise<void> {
  for (const rows of batches(catalogSeed.cardTypes)) await db.insert(cardTypes).values([...rows]);
  for (const rows of batches(catalogSeed.cardSupertypes))
    await db.insert(cardSupertypes).values([...rows]);
  for (const rows of batches(catalogSeed.rarities)) await db.insert(rarities).values([...rows]);
  for (const rows of batches(catalogSeed.domains)) await db.insert(domains).values([...rows]);
  for (const rows of batches(catalogSeed.tags)) await db.insert(tags).values([...rows]);
  for (const rows of batches(catalogSeed.keywords)) await db.insert(keywords).values([...rows]);
  for (const rows of batches(catalogSeed.cardSets)) await db.insert(cardSets).values([...rows]);
  for (const rows of batches(catalogSeed.setMarketplaceReferences)) {
    await db.insert(setMarketplaceReferences).values([...rows]);
  }
  for (const rows of batches(catalogSeed.cards)) await db.insert(cards).values([...rows]);
  for (const rows of batches(catalogSeed.cardPrintings))
    await db.insert(cardPrintings).values([...rows]);
  for (const rows of batches(catalogSeed.cardMedia)) await db.insert(cardMedia).values([...rows]);
  for (const rows of batches(catalogSeed.cardImageSources))
    await db.insert(cardImageSources).values([...rows]);
  for (const rows of batches(catalogSeed.cardDomains))
    await db.insert(cardDomains).values([...rows]);
  for (const rows of batches(catalogSeed.cardTags)) await db.insert(cardTags).values([...rows]);
  for (const rows of batches(catalogSeed.cardMarketplaceReferences)) {
    await db.insert(cardMarketplaceReferences).values([...rows]);
  }
  for (const rows of batches(catalogSeed.cardKeywords))
    await db.insert(cardKeywords).values([...rows]);
  for (const rows of batches(catalogSeed.cardKeywordTargets))
    await db.insert(cardKeywordTargets).values([...rows]);
  for (const rows of batches(catalogSeed.cardSpeeds)) await db.insert(cardSpeeds).values([...rows]);
}

function* batches<Value>(values: readonly Value[]): Generator<readonly Value[]> {
  for (let start = 0; start < values.length; start += INSERT_BATCH_SIZE) {
    yield values.slice(start, start + INSERT_BATCH_SIZE);
  }
}

export { ensureReferenceDataSeeded };
