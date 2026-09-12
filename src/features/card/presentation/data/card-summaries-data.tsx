import type { ReactNode } from "react";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardSummary } from "@/features/card/card-summary";
import type { CardSummaryLister } from "@/features/card/card-summary-lister";
import type { CardListKeyCriteria } from "@/features/card/queries/card-keys";
import { listCardSummariesPagedQuery } from "@/features/card/queries/card-queries";
import { usePagedReadState, type PagingState } from "@/hooks/use-paged-read-state";

const CARD_PAGING = {
  loadMoreErrorMessage: "Could not load more cards.",
  loadedPageMessage: (shown: number, total: number) => `Showing ${shown} of ${total} cards.`,
};

interface CardSummariesDataContent {
  readonly cards: readonly CardSummary[];
  readonly hasMore: boolean;
  readonly isRefreshing: boolean;
  readonly paging: PagingState;
  readonly total: number;
  loadMore(): void;
  refresh(): void;
  retryLoadMore(): void;
}

interface CardSummariesDataProps {
  readonly cardCounter: CardCounter;
  readonly cardSummaryLister: CardSummaryLister;
  readonly children: (content: CardSummariesDataContent) => ReactNode;
  readonly criteria: CardListKeyCriteria;
}

function CardSummariesData({
  cardCounter,
  cardSummaryLister,
  children,
  criteria,
}: CardSummariesDataProps) {
  const { state, loadMore, refresh, reload } = usePagedReadState(
    listCardSummariesPagedQuery(criteria, { cardCounter, cardSummaryLister }),
    CARD_PAGING,
  );

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="link" />}
        message="Could not load cards."
      />
    ))
    .with({ type: "success" }, (loaded) =>
      children({
        cards: loaded.items,
        hasMore: loaded.hasMore,
        isRefreshing: loaded.isRefreshing,
        paging: loaded.paging,
        total: loaded.total,
        loadMore,
        refresh,
        retryLoadMore: loadMore,
      }),
    )
    .exhaustive();
}

export { CardSummariesData };
export type { CardSummariesDataContent, CardSummariesDataProps };
