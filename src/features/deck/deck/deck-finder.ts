import type { ReadOptions } from "@/shared/read-options";

import type { Deck, DeckId } from "./deck";

/** Finds one saved deck by its identifier. */
interface DeckFinder {
  get(id: DeckId, options?: ReadOptions): Promise<Deck | null>;
}

export type { DeckFinder };
