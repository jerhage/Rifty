import type { CardSet } from "./card-set";

/** Lists catalog sets in their publication order. */
interface SetLister {
  getAll(): Promise<readonly CardSet[]>;
}

export type { SetLister };
