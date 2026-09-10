import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import migrations from "../../../drizzle/migrations";

import type { Logger } from "@/application/ports/logger";
import { DrizzleLoggerAdapter } from "@/infrastructure/drizzle/drizzle-logger-adapter";
import { createCatalogDataStore, type CatalogDataStore } from "./catalog-data-store";
import { createDeckDataStore, type DeckDataStore } from "./deck-data-store";
import { ensureCatalogSeeded } from "./catalog-seeder";

/**
 * The database file is still named for the catalog it was created to hold; renaming it would
 * orphan the catalog already on every installed device.
 */
const CATALOG_DATABASE_NAME = "catalog.db";

interface AppDataStore {
  readonly catalog: CatalogDataStore;
  readonly decks: DeckDataStore;
}

/** Opens the local database, applies committed migrations, and seeds the catalog. */
async function openAppDataStore(logger: Logger, imageBaseUrl: string): Promise<AppDataStore> {
  const database = SQLite.openDatabaseSync(CATALOG_DATABASE_NAME);
  await database.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  try {
    await migrate(drizzle(database, { logger: new DrizzleLoggerAdapter(logger) }), migrations);
  } catch (error) {
    throw new Error(`Could not migrate the app database: ${errorMessage(error)}`, { cause: error });
  }
  try {
    await ensureCatalogSeeded(database, logger);
  } catch (error) {
    throw new Error(`Could not seed the card catalog database: ${errorMessage(error)}`, {
      cause: error,
    });
  }

  return {
    catalog: createCatalogDataStore(database, logger, imageBaseUrl),
    decks: createDeckDataStore(database, logger),
  };
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}

export { CATALOG_DATABASE_NAME, openAppDataStore };
export type { AppDataStore };
