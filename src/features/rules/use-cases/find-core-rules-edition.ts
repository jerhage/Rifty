import type { ReadOptions } from "@/shared/read-options";
import type { CoreRulesEdition } from "../core-rules-edition";
import type { CoreRulesEditionFinder } from "../core-rules-edition-finder";

type FindCoreRulesEditionResult =
  | { readonly type: "success"; readonly edition: CoreRulesEdition }
  | { readonly type: "documentMissing" };

interface FindCoreRulesEditionCapabilities {
  readonly coreRulesEditionFinder: CoreRulesEditionFinder;
}

async function findCoreRulesEdition(
  { coreRulesEditionFinder }: FindCoreRulesEditionCapabilities,
  options?: ReadOptions,
): Promise<FindCoreRulesEditionResult> {
  const edition = await coreRulesEditionFinder.get(options);
  return edition ? { type: "success", edition } : { type: "documentMissing" };
}

export { findCoreRulesEdition };
export type { FindCoreRulesEditionCapabilities, FindCoreRulesEditionResult };
