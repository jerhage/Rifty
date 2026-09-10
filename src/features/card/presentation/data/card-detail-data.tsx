import type { ReactNode } from "react";
import { match } from "ts-pattern";

import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { Card } from "@/features/card/card";
import type { CardFinder } from "@/features/card/card-finder";
import { findCard, type FindCardResult } from "@/features/card/use-cases/find-card";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import { type AsyncResult, useAsyncResult } from "@/hooks/use-async-result";
import type { ReadOptions } from "@/shared/read-options";

type CardDetailDataContent = AsyncResult<FindCardResult>;

interface CardDetailDataProps {
  readonly cardFinder: CardFinder;
  readonly cardId: PrintingId;
  readonly children: (card: Card) => ReactNode;
}

function CardDetailData({ cardFinder, cardId, children }: CardDetailDataProps) {
  const { result } = useAsyncResult<FindCardResult>(
    (options: ReadOptions) => findCard(cardId, { cardFinder }, options),
    [cardFinder, cardId],
  );

  return match(result)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "notFound" }, () => <ErrorState message="Card not found." />)
    .with({ type: "loadFailed" }, () => <ErrorState message="Could not load this card." />)
    .with({ type: "success" }, ({ card }) => children(card))
    .exhaustive();
}

export { CardDetailData };
export type { CardDetailDataContent, CardDetailDataProps };
