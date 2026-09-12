import type { ReactNode } from "react";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { Card } from "@/features/card/card";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";
import type { CardListKeyCriteria } from "@/features/card/queries/card-keys";
import { listCardsPagedQuery } from "@/features/card/queries/card-queries";
import { usePagedReadState, type PagingState } from "@/hooks/use-paged-read-state";

const CARD_PAGING = {
  loadMoreErrorMessage: "Could not load more cards.",
  loadedPageMessage: (shown: number, total: number) => `Showing ${shown} of ${total} cards.`,
};

interface CardsDataContent {
  readonly cards: readonly Card[];
  readonly hasMore: boolean;
  readonly paging: PagingState;
  readonly total: number;
  loadMore(): void;
}

interface CardsDataProps {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly children: (content: CardsDataContent) => ReactNode;
  readonly criteria: CardListKeyCriteria;
}

function CardsData({ cardCounter, cardLister, children, criteria }: CardsDataProps) {
  const { state, loadMore, reload } = usePagedReadState(
    listCardsPagedQuery(criteria, { cardCounter, cardLister }),
    CARD_PAGING,
  );

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="secondary" />}
        message="Could not load cards."
      />
    ))
    .with({ type: "success" }, (loaded) =>
      children({
        cards: loaded.items,
        hasMore: loaded.hasMore,
        paging: loaded.paging,
        total: loaded.total,
        loadMore,
      }),
    )
    .exhaustive();
}

export { CardsData };
export type { CardsDataContent };
