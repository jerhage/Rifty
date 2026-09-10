import type { ReactNode } from "react";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardListCriteria } from "@/features/card/card-list-criteria";
import type { CardSummaryLister } from "@/features/card/card-summary-lister";
import type { CardSummary } from "@/features/card/card-summary";
import { listCardSummaries } from "@/features/card/use-cases/list-card-summaries";
import { useAsyncPagedResult, type PagingState } from "@/hooks/use-async-paged-result";
import { useStableValue } from "@/hooks/use-stable-value";

const PAGE_SIZE = 30;

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
  readonly criteria: Omit<CardListCriteria, "limit" | "offset">;
}

function CardSummariesData({
  cardCounter,
  cardSummaryLister,
  children,
  criteria,
}: CardSummariesDataProps) {
  const stableCriteria = useStableValue(criteria);
  const { state, loadMore, refresh, reload } = useAsyncPagedResult<CardSummary>({
    deps: [cardCounter, cardSummaryLister, stableCriteria],
    loadMoreErrorMessage: "Could not load more cards.",
    pageSize: PAGE_SIZE,
    run: ({ limit, offset }, options) =>
      listCardSummaries(
        { ...stableCriteria, limit, offset },
        { cardCounter, cardSummaryLister },
        options,
      ),
  });

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "loadFailed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="link" />}
        message="Could not load cards."
      />
    ))
    .with({ type: "success" }, (loadedState) =>
      children({
        cards: loadedState.page.items,
        hasMore: loadedState.page.hasMore,
        isRefreshing: loadedState.isRefreshing,
        paging: loadedState.paging,
        total: loadedState.total,
        loadMore,
        refresh,
        retryLoadMore: loadMore,
      }),
    )
    .exhaustive();
}

export { CardSummariesData };
export type { CardSummariesDataContent, CardSummariesDataProps };
