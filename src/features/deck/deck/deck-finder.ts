import type { ReadOptions } from "@/shared/read-options";

import type { Deck, DeckId } from "./deck";

interface DeckFinder {
  get(id: DeckId, options?: ReadOptions): Promise<Deck | null>;
}

export type { DeckFinder };
