import type { CardCounter } from "./card-counter";
import type { CardFinder } from "./card-finder";
import type { CardLister } from "./card-lister";
import type { CardSummaryLister } from "./card-summary-lister";

/** Product-facing read capability for the local card catalog. */
interface CardRepository extends CardCounter, CardFinder, CardLister, CardSummaryLister {}

export type { CardRepository };
