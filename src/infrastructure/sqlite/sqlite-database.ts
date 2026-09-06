import type { SQLiteAsyncDatabase } from "drizzle-orm/sqlite-core/async";

type SqliteDatabase = SQLiteAsyncDatabase<"sync", unknown>;

export type { SqliteDatabase };
