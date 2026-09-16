import type { ReadOptions } from "@/shared/read-options";
import type { CoreRulesEdition } from "./core-rules-edition";

/** Finds the edition of the rules document the device holds. */
interface CoreRulesEditionFinder {
  get(options?: ReadOptions): Promise<CoreRulesEdition | null>;
}

export type { CoreRulesEditionFinder };
