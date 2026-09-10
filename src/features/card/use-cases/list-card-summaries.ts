import type { CardCounter } from "../card-counter";
import type { CardListCriteria } from "../card-list-criteria";
import type { CardSummary } from "../card-summary";
import type { CardSummaryLister } from "../card-summary-lister";
import type { Page } from "@/shared/page";
import type { ReadOptions } from "@/shared/read-options";

type ListCardSummariesResult =
  | { readonly type: "success"; readonly page: Page<CardSummary>; readonly total: number }
  | { readonly type: "listFailed" };

interface ListCardSummariesCapabilities {
  readonly cardCounter: CardCounter;
  readonly cardSummaryLister: CardSummaryLister;
}

async function listCardSummaries(
  criteria: CardListCriteria | undefined,
  { cardCounter, cardSummaryLister }: ListCardSummariesCapabilities,
  options?: ReadOptions,
): Promise<ListCardSummariesResult> {
  try {
    const [page, total] = await Promise.all([
      cardSummaryLister.getSummaryPage(criteria, options),
      cardCounter.count(criteria, options),
    ]);

    return { type: "success", page, total };
  } catch {
    return { type: "listFailed" };
  }
}

export { listCardSummaries };
export type { ListCardSummariesCapabilities, ListCardSummariesResult };
