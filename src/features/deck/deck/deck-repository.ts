import type { DeckFinder } from "./deck-finder";
import type { DeckLister } from "./deck-lister";
import type { DeckRemover } from "./deck-remover";
import type { DeckSaver } from "./deck-saver";

interface DeckRepository extends DeckFinder, DeckLister, DeckRemover, DeckSaver {}

export type { DeckRepository };
