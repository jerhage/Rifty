import type { CardDomainSelection } from "./card-domain-selection";
import type { CardListCriteria } from "./card-list-criteria";
import type { CardSummary } from "./card-summary";
import type { Page } from "@/shared/page";
import type { ReadOptions } from "@/shared/read-options";

/** Pages card summaries for cards that belong to every selected domain. */
interface CardDomainSummaryLister {
  getSummaryPageForDomains(
    domains: CardDomainSelection,
    criteria?: Pick<CardListCriteria, "limit" | "offset" | "sort">,
    options?: ReadOptions,
  ): Promise<Page<CardSummary>>;
}

export type { CardDomainSummaryLister };
