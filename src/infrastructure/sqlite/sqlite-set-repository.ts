import { asc, eq, inArray } from "drizzle-orm";

import type { SetCode } from "@/features/set/value-objects/set-code";
import type { CardSet } from "@/features/set/card-set";
import type { SetRepository } from "@/features/set/set-repository";
import {
  cardSets,
  setMarketplaceReferences,
} from "@/infrastructure/database/reference-schema/sets";
import { throwIfAborted, type ReadOptions } from "@/shared/read-options";

import { toDomainCardSet } from "./set-mapper";
import type { SqliteDatabase } from "./sqlite-database";

class SqliteSetRepository implements SetRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async get(code: SetCode, { signal }: ReadOptions = {}): Promise<CardSet | null> {
    throwIfAborted(signal);
    const [row] = await this.db.select().from(cardSets).where(eq(cardSets.code, code)).limit(1);
    throwIfAborted(signal);
    if (!row) return null;

    return (await this.#toDomainCardSets([row], signal))[0] ?? null;
  }

  async getAll({ signal }: ReadOptions = {}): Promise<readonly CardSet[]> {
    throwIfAborted(signal);
    const rows = await this.db
      .select()
      .from(cardSets)
      .orderBy(asc(cardSets.publishedOn), asc(cardSets.code));
    throwIfAborted(signal);
    return this.#toDomainCardSets(rows, signal);
  }

  async #toDomainCardSets(
    rows: readonly (typeof cardSets.$inferSelect)[],
    signal: AbortSignal | undefined,
  ): Promise<CardSet[]> {
    if (rows.length === 0) return [];

    const references = await this.db
      .select()
      .from(setMarketplaceReferences)
      .where(
        inArray(
          setMarketplaceReferences.setCode,
          rows.map((row) => row.code),
        ),
      )
      .orderBy(asc(setMarketplaceReferences.marketplace), asc(setMarketplaceReferences.externalId));
    throwIfAborted(signal);
    const referencesBySetCode = references.reduce((grouped, reference) => {
      const group = grouped.get(reference.setCode);
      if (group) group.push(reference);
      else grouped.set(reference.setCode, [reference]);
      return grouped;
    }, new Map<string, typeof references>());

    return rows.map((cardSet) =>
      toDomainCardSet({
        cardSet,
        marketplaceReferences: referencesBySetCode.get(cardSet.code) ?? [],
      }),
    );
  }
}

export { SqliteSetRepository };
