import type { CardDomainSelection } from "./card-domain-selection";
import type { CardListCriteria } from "./card-list-criteria";
import type { Card } from "./card";
import type { Page } from "@/shared/page";
import type { ReadOptions } from "@/shared/read-options";

/** Pages cards that belong to every selected domain. */
interface CardDomainLister {
  getPageForDomains(
    domains: CardDomainSelection,
    criteria?: Pick<CardListCriteria, "limit" | "offset" | "sort">,
    options?: ReadOptions,
  ): Promise<Page<Card>>;
}

export type { CardDomainLister };
