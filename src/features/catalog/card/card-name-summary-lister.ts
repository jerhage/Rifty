import type { CardListCriteria } from "./card-list-criteria";
import type { CardSummary } from "./card-summary";
import type { Page } from "@/shared/page";
import type { ReadOptions } from "@/shared/read-options";

/** Pages minimal card data whose printed or normalized name contains the search text. */
interface CardNameSummaryLister {
  getSummaryPageByName(
    name: string,
    criteria?: Pick<CardListCriteria, "limit" | "offset">,
    options?: ReadOptions,
  ): Promise<Page<CardSummary>>;
}

export type { CardNameSummaryLister };
