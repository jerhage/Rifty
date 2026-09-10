import type { CardListCriteria } from "../card-list-criteria";
import type { CardLister } from "../card-lister";
import type { Card } from "../card";
import type { Page } from "@/shared/page";

type ListCardsResult =
  | { readonly type: "success"; readonly page: Page<Card> }
  | { readonly type: "listFailed" };

interface ListCardsCapabilities {
  readonly cardLister: CardLister;
}

async function listCards(
  criteria: CardListCriteria | undefined,
  { cardLister }: ListCardsCapabilities,
): Promise<ListCardsResult> {
  try {
    return { type: "success", page: await cardLister.getPage(criteria) };
  } catch {
    return { type: "listFailed" };
  }
}

export { listCards };
export type { ListCardsCapabilities, ListCardsResult };
