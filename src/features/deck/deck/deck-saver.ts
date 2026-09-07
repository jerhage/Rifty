import type { Deck } from "./deck";

/** Persists a deck in full, replacing whatever was stored under its identifier. */
interface DeckSaver {
  save(deck: Deck): Promise<void>;
}

export type { DeckSaver };
