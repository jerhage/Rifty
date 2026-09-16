import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

import type { Logger } from "@/application/ports/logger";
import type { BookmarkRepository } from "@/features/annotation/bookmark-repository";
import type { NoteRepository } from "@/features/annotation/note-repository";
import { DrizzleLoggerAdapter } from "@/infrastructure/drizzle/drizzle-logger-adapter";
import { SqliteBookmarkRepository } from "@/infrastructure/sqlite/sqlite-bookmark-repository";
import { SqliteNoteRepository } from "@/infrastructure/sqlite/sqlite-note-repository";

interface AnnotationDataStore {
  readonly bookmarks: BookmarkRepository;
  readonly notes: NoteRepository;
}

/** Supplies bookmark and note capabilities backed by the app database. */
function createAnnotationDataStore(
  database: SQLite.SQLiteDatabase,
  logger: Logger,
): AnnotationDataStore {
  const db = drizzle(database, { logger: new DrizzleLoggerAdapter(logger) });

  return {
    bookmarks: new SqliteBookmarkRepository(db),
    notes: new SqliteNoteRepository(db),
  };
}

export { createAnnotationDataStore };
export type { AnnotationDataStore };
