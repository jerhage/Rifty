import type { Deck } from "./deck";

/** Replaces the whole aggregate stored under this identifier, entries included. */
interface DeckSaver {
  save(deck: Deck): Promise<void>;
}

export type { DeckSaver };
