import type { CardFinder } from "./card-finder";
import type { CardLister } from "./card-lister";

/** Product-facing read capability for the local card catalog. */
interface CardRepository extends CardFinder, CardLister {}

export type { CardRepository };
