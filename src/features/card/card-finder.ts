import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { Card } from "./card";
import type { ReadOptions } from "@/shared/read-options";

/** Finds one card as printed, by its printing id. */
interface CardFinder {
  get(printingId: PrintingId, options?: ReadOptions): Promise<Card | null>;
}

export type { CardFinder };
