import type { Card, CardId } from "./card";

/** Finds one persisted card printing by its source identifier. */
interface CardFinder {
  get(id: CardId): Promise<Card | null>;
}

export type { CardFinder };
