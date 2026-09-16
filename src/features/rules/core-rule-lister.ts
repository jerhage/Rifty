import type { ReadOptions } from "@/shared/read-options";
import type { CoreRule } from "./core-rule";

/** Lists the whole rules document in printed order, each rule carrying its own details. */
interface CoreRuleLister {
  getAll(options?: ReadOptions): Promise<readonly CoreRule[]>;
}

export type { CoreRuleLister };
