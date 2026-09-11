import type { ReadOptions } from "@/shared/read-options";

import type { Card } from "./card";
import type { CardId } from "./value-objects/card-id";

/** Finds one printing of a card by its gameplay identity, preferring the canonical printing. */
interface CardByCardIdFinder {
  getByCardId(cardId: CardId, options?: ReadOptions): Promise<Card | null>;
}

export type { CardByCardIdFinder };
