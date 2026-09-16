import { asc, desc } from "drizzle-orm";

import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import type { CoreRulesRepository } from "@/features/rules/core-rules-repository";
import {
  coreRuleDetails,
  coreRules,
  coreRulesEditions,
} from "@/infrastructure/database/reference-schema/core-rules";
import { throwIfAborted, type ReadOptions } from "@/shared/read-options";

import { toDomainCoreRule, toDomainCoreRulesEdition } from "./core-rules-mapper";
import type { SqliteDatabase } from "./sqlite-database";

class SqliteCoreRulesRepository implements CoreRulesRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async get({ signal }: ReadOptions = {}): Promise<CoreRulesEdition | null> {
    throwIfAborted(signal);
    const [row] = await this.db
      .select()
      .from(coreRulesEditions)
      .orderBy(desc(coreRulesEditions.publishedOn))
      .limit(1);
    throwIfAborted(signal);

    return row ? toDomainCoreRulesEdition(row) : null;
  }

  /**
   * Two queries for the whole document, never one per rule: the screen scrolls, searches and jumps
   * across all of it, so there is no page to fetch and the details are grouped here.
   */
  async getAll({ signal }: ReadOptions = {}): Promise<readonly CoreRule[]> {
    throwIfAborted(signal);
    const ruleRows = await this.db.select().from(coreRules).orderBy(asc(coreRules.position));
    throwIfAborted(signal);
    if (ruleRows.length === 0) return [];

    const detailRows = await this.db
      .select()
      .from(coreRuleDetails)
      .orderBy(asc(coreRuleDetails.ruleNumber), asc(coreRuleDetails.position));
    throwIfAborted(signal);
    const detailsByRuleNumber = detailRows.reduce((grouped, detail) => {
      const group = grouped.get(detail.ruleNumber);
      if (group) group.push(detail);
      else grouped.set(detail.ruleNumber, [detail]);
      return grouped;
    }, new Map<string, typeof detailRows>());

    return ruleRows.map((coreRule) =>
      toDomainCoreRule({ coreRule, details: detailsByRuleNumber.get(coreRule.number) ?? [] }),
    );
  }
}

export { SqliteCoreRulesRepository };
