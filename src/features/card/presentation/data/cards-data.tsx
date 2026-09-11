import { useCallback, type ReactNode } from "react";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { Card } from "@/features/card/card";
import type { CardListCriteria } from "@/features/card/card-list-criteria";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";
import { listCards } from "@/features/card/use-cases/list-cards";
import {
  useAsyncPagedResult,
  type PagedRun,
  type PagingState,
} from "@/hooks/use-async-paged-result";
import { useStableValue } from "@/hooks/use-stable-value";

const PAGE_SIZE = 30;

interface CardsDataContent {
  readonly cards: readonly Card[];
  readonly hasMore: boolean;
  readonly isRefreshing: boolean;
  readonly paging: PagingState;
  readonly total: number;
  loadMore(): void;
  refresh(): void;
}

interface CardsDataProps {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly children: (content: CardsDataContent) => ReactNode;
  readonly criteria: Omit<CardListCriteria, "limit" | "offset">;
}

function CardsData({ cardCounter, cardLister, children, criteria }: CardsDataProps) {
  const stableCriteria = useStableValue(criteria);
  const run = useCallback<PagedRun<Card>>(
    ({ limit, offset }, options) =>
      listCards({ ...stableCriteria, limit, offset }, { cardCounter, cardLister }, options),
    [cardCounter, cardLister, stableCriteria],
  );
  const { state, loadMore, refresh, reload } = useAsyncPagedResult<Card>({
    loadMoreErrorMessage: "Could not load more cards.",
    pageSize: PAGE_SIZE,
    run,
  });

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "loadFailed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="secondary" />}
        message="Could not load cards."
      />
    ))
    .with({ type: "success" }, (loaded) =>
      children({
        cards: loaded.page.items,
        hasMore: loaded.page.hasMore,
        isRefreshing: loaded.isRefreshing,
        paging: loaded.paging,
        total: loaded.total,
        loadMore,
        refresh,
      }),
    )
    .exhaustive();
}

export { CardsData };
export type { CardsDataContent };
