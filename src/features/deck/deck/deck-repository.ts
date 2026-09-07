import type { DeckFinder } from "./deck-finder";
import type { DeckLister } from "./deck-lister";

/** Product-facing read capability for saved decks. */
interface DeckRepository extends DeckFinder, DeckLister {}

export type { DeckRepository };
