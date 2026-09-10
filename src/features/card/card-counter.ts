import type { ReadOptions } from "@/shared/read-options";

import type { CardListCriteria } from "./card-list-criteria";

/** How many cards match, irrespective of paging. */
interface CardCounter {
  count(criteria?: CardListCriteria, options?: ReadOptions): Promise<number>;
}

export type { CardCounter };
