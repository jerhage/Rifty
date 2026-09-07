import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

import type { Logger } from "@/application/ports/logger";
import type { DeckRepository } from "@/features/deck/deck/deck-repository";
import { DrizzleLoggerAdapter } from "@/infrastructure/drizzle/drizzle-logger-adapter";
import { SqliteDeckRepository } from "@/infrastructure/sqlite/sqlite-deck-repository";

interface DeckDataStore {
  readonly repository: DeckRepository;
}

/** Supplies deck repository capabilities backed by the app database. */
function createDeckDataStore(database: SQLite.SQLiteDatabase, logger: Logger): DeckDataStore {
  const db = drizzle(database, { logger: new DrizzleLoggerAdapter(logger) });

  return { repository: new SqliteDeckRepository(db) };
}

export { createDeckDataStore };
export type { DeckDataStore };
