import { asc } from "drizzle-orm";

import type { Keyword } from "@/features/catalog/keyword/keyword";
import type { KeywordLister } from "@/features/catalog/keyword/keyword-lister";
import { keywords } from "@/infrastructure/database/catalog-schema/keywords";
import { throwIfAborted, type ReadOptions } from "@/shared/read-options";

import { toDomainKeyword } from "./keyword-mapper";
import type { SqliteDatabase } from "./sqlite-database";

class SqliteKeywordRepository implements KeywordLister {
  constructor(private readonly db: SqliteDatabase) {}

  async getAll({ signal }: ReadOptions = {}): Promise<readonly Keyword[]> {
    throwIfAborted(signal);
    const rows = await this.db.select().from(keywords).orderBy(asc(keywords.name));
    throwIfAborted(signal);

    return rows.map(toDomainKeyword);
  }
}

export { SqliteKeywordRepository };
