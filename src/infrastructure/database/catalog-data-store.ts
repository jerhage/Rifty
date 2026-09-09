import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

import type { Logger } from "@/application/ports/logger";
import type { CardRepository } from "@/features/catalog/card/card-repository";
import type { SetRepository } from "@/features/catalog/set/set-repository";
import { DrizzleLoggerAdapter } from "@/infrastructure/drizzle/drizzle-logger-adapter";
import { SqliteCardRepository } from "@/infrastructure/sqlite/sqlite-card-repository";
import { SqliteSetRepository } from "@/infrastructure/sqlite/sqlite-set-repository";

interface CatalogDataStore {
  readonly cards: CardRepository;
  readonly sets: SetRepository;
}

/** Supplies catalog repository capabilities backed by the app database. */
function createCatalogDataStore(
  database: SQLite.SQLiteDatabase,
  logger: Logger,
  imageBaseUrl: string,
): CatalogDataStore {
  const db = drizzle(database, { logger: new DrizzleLoggerAdapter(logger) });
  return {
    cards: new SqliteCardRepository(db, imageBaseUrl),
    sets: new SqliteSetRepository(db),
  };
}

export { createCatalogDataStore };
export type { CatalogDataStore };
