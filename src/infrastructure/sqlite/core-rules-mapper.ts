import { parseCoreRule, type CoreRule } from "@/features/rules/core-rule";
import { parseCoreRulesEdition, type CoreRulesEdition } from "@/features/rules/core-rules-edition";
import {
  coreRuleDetailSelectSchema,
  coreRuleSelectSchema,
  coreRulesEditionSelectSchema,
} from "@/infrastructure/database/reference-schema/core-rules";

interface CoreRulePersistenceShape {
  readonly coreRule: unknown;
  readonly details: readonly unknown[];
}

function toDomainCoreRule({ coreRule, details }: CoreRulePersistenceShape): CoreRule {
  const persistedCoreRule = coreRuleSelectSchema.parse(coreRule);

  return parseCoreRule({
    number: persistedCoreRule.number,
    parentNumber: persistedCoreRule.parentNumber,
    position: persistedCoreRule.position,
    kind: persistedCoreRule.kind,
    body: persistedCoreRule.body,
    details: details.map((detail) => {
      const persistedDetail = coreRuleDetailSelectSchema.parse(detail);
      return {
        position: persistedDetail.position,
        kind: persistedDetail.kind,
        body: persistedDetail.body,
      };
    }),
  });
}

function toDomainCoreRulesEdition(edition: unknown): CoreRulesEdition {
  const persistedEdition = coreRulesEditionSelectSchema.parse(edition);

  return parseCoreRulesEdition({
    title: persistedEdition.title,
    publishedOn: persistedEdition.publishedOn,
  });
}

export { toDomainCoreRule, toDomainCoreRulesEdition };
