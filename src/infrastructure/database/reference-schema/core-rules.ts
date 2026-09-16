import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";

const coreRuleKindSchema = z.enum(["heading", "rule"]);
const coreRuleDetailKindSchema = z.enum(["bullet", "example"]);

/** The identity of the rules document a seed materializes; one row. */
const coreRulesEditions = sqliteTable("core_rules_edition", {
  id: text().primaryKey(),
  title: text().notNull(),
  publishedOn: text("published_on").notNull(),
});

/**
 * One numbered entry of the document, as a tree. `position` carries document order because a rule
 * number cannot: `103` sorts before `50` as text, and `103.2.a` has no numeric reading at all.
 */
const coreRules = sqliteTable(
  "core_rule",
  {
    number: text().primaryKey(),
    parentNumber: text("parent_number").references((): AnySQLiteColumn => coreRules.number, {
      onDelete: "cascade",
    }),
    position: integer().notNull(),
    kind: text().notNull(),
    body: text().notNull(),
  },
  (table) => [
    check("core_rule_position_not_negative", sql`${table.position} >= 0`),
    index("core_rule_position").on(table.position),
  ],
);

/** A bullet or an example beneath one rule, kept apart from the rule's own body. */
const coreRuleDetails = sqliteTable(
  "core_rule_detail",
  {
    ruleNumber: text("rule_number")
      .notNull()
      .references(() => coreRules.number, { onDelete: "cascade" }),
    position: integer().notNull(),
    kind: text().notNull(),
    body: text().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ruleNumber, table.position] }),
    check("core_rule_detail_position_not_negative", sql`${table.position} >= 0`),
  ],
);

const coreRulesEditionSelectSchema = createSelectSchema(coreRulesEditions);
const coreRulesEditionInsertSchema = createInsertSchema(coreRulesEditions, {
  id: (schema) => schema.trim().min(1),
  title: (schema) => schema.trim().min(1),
  publishedOn: (schema) => schema.trim().min(1),
});

const coreRuleSelectSchema = createSelectSchema(coreRules, {
  kind: coreRuleKindSchema,
});
const coreRuleInsertSchema = createInsertSchema(coreRules, {
  number: (schema) => schema.trim().min(1),
  parentNumber: (schema) => schema.trim().min(1),
  position: (schema) => schema.int().nonnegative(),
  kind: coreRuleKindSchema,
  body: (schema) => schema.trim().min(1),
});

const coreRuleDetailSelectSchema = createSelectSchema(coreRuleDetails, {
  kind: coreRuleDetailKindSchema,
});
const coreRuleDetailInsertSchema = createInsertSchema(coreRuleDetails, {
  ruleNumber: (schema) => schema.trim().min(1),
  position: (schema) => schema.int().nonnegative(),
  kind: coreRuleDetailKindSchema,
  body: (schema) => schema.trim().min(1),
});

export {
  coreRuleDetailInsertSchema,
  coreRuleDetailKindSchema,
  coreRuleDetailSelectSchema,
  coreRuleDetails,
  coreRuleInsertSchema,
  coreRuleKindSchema,
  coreRuleSelectSchema,
  coreRules,
  coreRulesEditionInsertSchema,
  coreRulesEditionSelectSchema,
  coreRulesEditions,
};
