import type { ReadOptions } from "@/shared/read-options";

import type { Card } from "./card";
import type { PrintingId } from "./value-objects/printing-id";

/** Resolves an explicit set of printing ids to cards, returning one card for every id that exists. */
interface CardsByPrintingIdsFinder {
  getAllByPrintingIds(
    printingIds: readonly PrintingId[],
    options?: ReadOptions,
  ): Promise<readonly Card[]>;
}

export type { CardsByPrintingIdsFinder };
