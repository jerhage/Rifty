import type { CardListCriteria } from "./card-list-criteria";
import type { Page } from "@/shared/page";
import type { Card } from "./card";

/** Pages through card printings that match catalog-analysis criteria. */
interface CardLister {
  getPage(criteria?: CardListCriteria): Promise<Page<Card>>;
}

export type { CardLister };
