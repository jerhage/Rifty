import type { CardByCardIdFinder } from "./card-by-card-id-finder";
import type { CardCounter } from "./card-counter";
import type { CardFinder } from "./card-finder";
import type { CardLister } from "./card-lister";
import type { CardSummariesByPrintingIdsFinder } from "./card-summaries-by-printing-ids-finder";
import type { CardSummaryLister } from "./card-summary-lister";
import type { CardsByPrintingIdsFinder } from "./cards-by-printing-ids-finder";

/** Product-facing read capability for the local card catalog. */
interface CardRepository
  extends
    CardByCardIdFinder,
    CardCounter,
    CardFinder,
    CardLister,
    CardSummariesByPrintingIdsFinder,
    CardSummaryLister,
    CardsByPrintingIdsFinder {}

export type { CardRepository };
