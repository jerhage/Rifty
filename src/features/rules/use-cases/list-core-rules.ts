import type { ReadOptions } from "@/shared/read-options";
import type { CoreRule } from "../core-rule";
import type { CoreRuleLister } from "../core-rule-lister";

type ListCoreRulesResult =
  | { readonly type: "success"; readonly coreRules: readonly CoreRule[] }
  | { readonly type: "documentMissing" };

interface ListCoreRulesCapabilities {
  readonly coreRuleLister: CoreRuleLister;
}

/**
 * The document is seeded whole or not at all, so no rules means no document rather than a document
 * a caller has to interpret.
 */
async function listCoreRules(
  { coreRuleLister }: ListCoreRulesCapabilities,
  options?: ReadOptions,
): Promise<ListCoreRulesResult> {
  const coreRules = await coreRuleLister.getAll(options);
  return coreRules.length > 0 ? { type: "success", coreRules } : { type: "documentMissing" };
}

export { listCoreRules };
export type { ListCoreRulesCapabilities, ListCoreRulesResult };
