import type { ReadOptions } from "@/shared/read-options";

import type { CoreRule } from "./core-rule";
import type { CoreRuleNumber } from "./value-objects/core-rule-number";

/** Resolves an explicit set of rule numbers, in document order, skipping numbers the document lacks. */
interface CoreRulesByNumbersFinder {
  getAllByNumbers(
    numbers: readonly CoreRuleNumber[],
    options?: ReadOptions,
  ): Promise<readonly CoreRule[]>;
}

export type { CoreRulesByNumbersFinder };
