import type { ReadOptions } from "@/shared/read-options";

import type { Deck } from "./deck";

/** Ordered most recently edited first. */
interface DeckLister {
  getAll(options?: ReadOptions): Promise<readonly Deck[]>;
}

export type { DeckLister };
