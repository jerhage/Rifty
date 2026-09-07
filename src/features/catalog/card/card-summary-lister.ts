import type { CardListCriteria } from "./card-list-criteria";
import type { CardSummary } from "./card-summary";
import type { Page } from "@/shared/page";
import type { ReadOptions } from "@/shared/read-options";

/** Pages the minimal card data required by catalog browsing. */
interface CardSummaryLister {
  getSummaryPage(
    criteria?: Pick<CardListCriteria, "limit" | "offset" | "search" | "sort">,
    options?: ReadOptions,
  ): Promise<Page<CardSummary>>;
}

export type { CardSummaryLister };
