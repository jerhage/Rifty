import type { CardDomainLister } from "./card-domain-lister";
import type { CardDomainSummaryLister } from "./card-domain-summary-lister";
import type { CardFinder } from "./card-finder";
import type { CardLister } from "./card-lister";
import type { CardSummaryLister } from "./card-summary-lister";

/** Product-facing read capability for the local card catalog. */
interface CardRepository
  extends CardDomainLister, CardDomainSummaryLister, CardFinder, CardLister, CardSummaryLister {}

export type { CardRepository };
