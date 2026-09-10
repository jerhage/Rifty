import type { Card, CardId } from "./card";
import type { ReadOptions } from "@/shared/read-options";

/** Finds one persisted card printing by its source identifier. */
interface CardFinder {
  get(id: CardId, options?: ReadOptions): Promise<Card | null>;
}

export type { CardFinder };
