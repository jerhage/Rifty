import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

import type { CardRepository } from "@/features/catalog/card/card-repository";
import type { SetRepository } from "@/features/catalog/set/set-repository";
import { SqliteCardRepository } from "@/infrastructure/sqlite/sqlite-card-repository";
import { SqliteSetRepository } from "@/infrastructure/sqlite/sqlite-set-repository";

interface CatalogDataStore {
  readonly cards: CardRepository;
  readonly sets: SetRepository;
}

/** Supplies catalog repository capabilities backed by the app database. */
function createCatalogDataStore(database: SQLite.SQLiteDatabase): CatalogDataStore {
  const db = drizzle(database);
  return {
    cards: new SqliteCardRepository(db),
    sets: new SqliteSetRepository(db),
  };
}

export { createCatalogDataStore };
export type { CatalogDataStore };
