import {
  coreRuleDetailInsertSchema,
  coreRuleInsertSchema,
  coreRulesEditionInsertSchema,
} from "../src/infrastructure/database/reference-schema/core-rules";
import type {
  coreRuleDetails,
  coreRules,
  coreRulesEditions,
} from "../src/infrastructure/database/reference-schema/core-rules";
import type { CoreRulesDocument } from "./core-rules-parse";

type CoreRulesSeed = {
  coreRulesEditions: (typeof coreRulesEditions.$inferInsert)[];
  coreRules: (typeof coreRules.$inferInsert)[];
  coreRuleDetails: (typeof coreRuleDetails.$inferInsert)[];
};

function assertValid<Row>(
  rows: readonly Row[],
  parse: (row: Row) => unknown,
  nameOf: (row: Row) => string,
): void {
  for (const row of rows) {
    try {
      parse(row);
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);

      throw new Error(`${nameOf(row)} does not satisfy its insert schema: ${reason}`, { cause });
    }
  }
}

function buildCoreRulesSeed(document: CoreRulesDocument): CoreRulesSeed {
  const seed: CoreRulesSeed = {
    // The published date is the edition's identity, so a later edition adds a row of its own rather
    // than overwriting an unnamed one.
    coreRulesEditions: [
      { id: document.publishedOn, title: document.title, publishedOn: document.publishedOn },
    ],
    coreRules: document.coreRules.map((coreRule) => ({
      number: coreRule.number,
      parentNumber: coreRule.parentNumber,
      position: coreRule.position,
      kind: coreRule.kind,
      body: coreRule.body,
    })),
    coreRuleDetails: document.coreRules.flatMap((coreRule) =>
      coreRule.details.map((detail) => ({
        ruleNumber: coreRule.number,
        position: detail.position,
        kind: detail.kind,
        body: detail.body,
      })),
    ),
  };

  assertValid(
    seed.coreRulesEditions,
    (row) => coreRulesEditionInsertSchema.parse(row),
    (row) => `The core rules edition ${row.id}`,
  );
  assertValid(
    seed.coreRules,
    (row) => coreRuleInsertSchema.parse(row),
    (row) => `The core rule ${row.number}`,
  );
  assertValid(
    seed.coreRuleDetails,
    (row) => coreRuleDetailInsertSchema.parse(row),
    (row) => `The detail ${row.position} of core rule ${row.ruleNumber}`,
  );

  return seed;
}

export { buildCoreRulesSeed };
export type { CoreRulesSeed };
