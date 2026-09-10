import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { Card } from "./card";
import type { ReadOptions } from "@/shared/read-options";

/** Finds one persisted card printing by its source identifier. */
interface CardFinder {
  get(id: PrintingId, options?: ReadOptions): Promise<Card | null>;
}

export type { CardFinder };
