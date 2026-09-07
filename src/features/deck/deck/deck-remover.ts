import type { DeckId } from "./deck";

/** Entries go with the deck, through the schema's cascade. */
interface DeckRemover {
  remove(id: DeckId): Promise<void>;
}

export type { DeckRemover };
