import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import migrations from "../../../drizzle/migrations";

import type { Logger } from "@/application/ports/logger";
import { DrizzleLoggerAdapter } from "@/infrastructure/drizzle/drizzle-logger-adapter";
import { createAnnotationDataStore, type AnnotationDataStore } from "./annotation-data-store";
import { createReferenceDataStore, type ReferenceDataStore } from "./reference-data-store";
import { createDeckDataStore, type DeckDataStore } from "./deck-data-store";
import { ensureCatalogSeeded, ensureCoreRulesSeeded } from "./reference-seeder";

/**
 * The database file is still named for the catalog it was created to hold; renaming it would
 * orphan the catalog already on every installed device.
 */
const CATALOG_DATABASE_NAME = "catalog.db";

interface AppDataStore {
  readonly annotations: AnnotationDataStore;
  readonly reference: ReferenceDataStore;
  readonly decks: DeckDataStore;
}

/** Opens the local database, applies committed migrations, and seeds every reference dataset. */
async function openAppDataStore(logger: Logger, imageBaseUrl: string): Promise<AppDataStore> {
  const database = SQLite.openDatabaseSync(CATALOG_DATABASE_NAME);
  await database.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  try {
    await migrate(drizzle(database, { logger: new DrizzleLoggerAdapter(logger) }), migrations);
  } catch (error) {
    throw new Error(`Could not migrate the app database: ${errorMessage(error)}`, { cause: error });
  }
  await seedDataset("card catalog", () => ensureCatalogSeeded(database, logger));
  await seedDataset("core rules", () => ensureCoreRulesSeeded(database, logger));

  return {
    annotations: createAnnotationDataStore(database, logger),
    reference: createReferenceDataStore(database, logger, imageBaseUrl),
    decks: createDeckDataStore(database, logger),
  };
}

async function seedDataset(name: string, seed: () => Promise<void>): Promise<void> {
  try {
    await seed();
  } catch (error) {
    throw new Error(`Could not seed the ${name} into the app database: ${errorMessage(error)}`, {
      cause: error,
    });
  }
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}

export { CATALOG_DATABASE_NAME, openAppDataStore };
export type { AppDataStore };
