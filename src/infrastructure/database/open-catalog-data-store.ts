import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import migrations from "../../../drizzle/migrations";

import { createCatalogDataStore, type CatalogDataStore } from "./catalog-data-store";

const CATALOG_DATABASE_NAME = "catalog.db";

/** Opens the local card catalog and applies committed Drizzle migrations. */
async function openCatalogDataStore(): Promise<CatalogDataStore> {
  const database = SQLite.openDatabaseSync(CATALOG_DATABASE_NAME);
  await database.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  await migrate(drizzle(database), migrations);
  return createCatalogDataStore(database);
}

export { CATALOG_DATABASE_NAME, openCatalogDataStore };
