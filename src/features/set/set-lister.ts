import type { CardSet } from "./card-set";
import type { ReadOptions } from "@/shared/read-options";

/** Lists catalog sets in their publication order. */
interface SetLister {
  getAll(options?: ReadOptions): Promise<readonly CardSet[]>;
}

export type { SetLister };
