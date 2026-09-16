import type { ReadOptions } from "@/shared/read-options";

import type { CardSummary } from "./card-summary";
import type { PrintingId } from "./value-objects/printing-id";

/** Resolves an explicit set of printing ids to summaries, in catalog order, skipping absent ids. */
interface CardSummariesByPrintingIdsFinder {
  getSummariesByPrintingIds(
    printingIds: readonly PrintingId[],
    options?: ReadOptions,
  ): Promise<readonly CardSummary[]>;
}

export type { CardSummariesByPrintingIdsFinder };
