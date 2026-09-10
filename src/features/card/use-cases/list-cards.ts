import type { CardCounter } from "../card-counter";
import type { CardListCriteria } from "../card-list-criteria";
import type { CardLister } from "../card-lister";
import type { Card } from "../card";
import type { Page } from "@/shared/page";
import type { ReadOptions } from "@/shared/read-options";

type ListCardsResult =
  | { readonly type: "success"; readonly page: Page<Card>; readonly total: number }
  | { readonly type: "listFailed" };

interface ListCardsCapabilities {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
}

async function listCards(
  criteria: CardListCriteria | undefined,
  { cardCounter, cardLister }: ListCardsCapabilities,
  options?: ReadOptions,
): Promise<ListCardsResult> {
  try {
    const [page, total] = await Promise.all([
      cardLister.getPage(criteria, options),
      cardCounter.count(criteria, options),
    ]);

    return { type: "success", page, total };
  } catch {
    return { type: "listFailed" };
  }
}

export { listCards };
export type { ListCardsCapabilities, ListCardsResult };
