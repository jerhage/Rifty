import type { ReactNode } from "react";
import { match } from "ts-pattern";

import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { Card } from "@/features/card/card";
import type { CardFinder } from "@/features/card/card-finder";
import { getCardQuery } from "@/features/card/queries/card-queries";
import type { FindCardResult } from "@/features/card/use-cases/find-card";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import { useReadState, type ReadState } from "@/hooks/use-read-state";

type CardDetailDataContent = ReadState<FindCardResult>;

interface CardDetailDataProps {
  readonly cardFinder: CardFinder;
  readonly cardId: PrintingId;
  readonly children: (card: Card) => ReactNode;
}

function CardDetailData({ cardFinder, cardId, children }: CardDetailDataProps) {
  const { state } = useReadState(getCardQuery(cardId, { cardFinder }));

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => <ErrorState message="Could not load this card." />)
    .with({ type: "notFound" }, () => <ErrorState message="Card not found." />)
    .with({ type: "success" }, ({ card }) => children(card))
    .exhaustive();
}

export { CardDetailData };
export type { CardDetailDataContent, CardDetailDataProps };
