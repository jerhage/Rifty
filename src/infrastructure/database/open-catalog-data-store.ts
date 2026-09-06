import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import migrations from "../../../drizzle/migrations";

import { createCatalogDataStore, type CatalogDataStore } from "./catalog-data-store";
import { ensureCatalogSeeded } from "./catalog-seeder";

const CATALOG_DATABASE_NAME = "catalog.db";

/** Opens the local card catalog and applies committed Drizzle migrations. */
async function openCatalogDataStore(): Promise<CatalogDataStore> {
  const database = SQLite.openDatabaseSync(CATALOG_DATABASE_NAME);
  await database.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  try {
    await migrate(drizzle(database), migrations);
  } catch (error) {
    throw new Error(`Could not migrate the card catalog database: ${errorMessage(error)}`, {
      cause: error,
    });
  }
  try {
    await ensureCatalogSeeded(database);
  } catch (error) {
    throw new Error(`Could not seed the card catalog database: ${errorMessage(error)}`, {
      cause: error,
    });
  }
  return createCatalogDataStore(database);
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}

export { CATALOG_DATABASE_NAME, openCatalogDataStore };
