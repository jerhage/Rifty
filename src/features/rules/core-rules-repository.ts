import type { CoreRuleLister } from "./core-rule-lister";
import type { CoreRulesByNumbersFinder } from "./core-rules-by-numbers-finder";
import type { CoreRulesEditionFinder } from "./core-rules-edition-finder";

/** Product-facing read capability for the core rules document. */
interface CoreRulesRepository
  extends CoreRuleLister, CoreRulesByNumbersFinder, CoreRulesEditionFinder {}

export type { CoreRulesRepository };
