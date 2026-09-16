import type { CoreRuleLister } from "./core-rule-lister";
import type { CoreRulesEditionFinder } from "./core-rules-edition-finder";

/** Product-facing read capability for the core rules document. */
interface CoreRulesRepository extends CoreRuleLister, CoreRulesEditionFinder {}

export type { CoreRulesRepository };
