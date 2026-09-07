import type { DeckId } from "./deck";

/** Deletes a saved deck and the entries belonging to it. */
interface DeckRemover {
  remove(id: DeckId): Promise<void>;
}

export type { DeckRemover };
