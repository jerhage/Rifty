import type { ReactNode } from "react";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { CardByCardIdFinder } from "@/features/card/card-by-card-id-finder";
import type { CardsByPrintingIdsFinder } from "@/features/card/cards-by-printing-ids-finder";
import type { DeckId } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";
import type { ResolvedDeck } from "@/features/deck/deck/resolved-deck";
import { getResolvedDeckQuery } from "@/features/deck/presentation/queries/deck-queries";
import { useReadState } from "@/hooks/use-read-state";

interface DeckDetailContent {
  readonly resolvedDeck: ResolvedDeck;
  reload(): void;
}

function DeckDetailData({
  cardByCardIdFinder,
  cardsByPrintingIdsFinder,
  children,
  deckFinder,
  deckId,
}: {
  readonly cardByCardIdFinder: CardByCardIdFinder;
  readonly cardsByPrintingIdsFinder: CardsByPrintingIdsFinder;
  readonly children: (content: DeckDetailContent) => ReactNode;
  readonly deckFinder: DeckFinder;
  readonly deckId: DeckId;
}) {
  const { reload, state } = useReadState(
    getResolvedDeckQuery(deckId, { cardByCardIdFinder, cardsByPrintingIdsFinder, deckFinder }),
  );

  return match(state)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="secondary" />}
        message="Could not load the deck."
      />
    ))
    .with({ type: "notFound" }, () => <ErrorState message="That deck no longer exists." />)
    .with({ type: "success" }, ({ resolvedDeck }) => children({ resolvedDeck, reload }))
    .exhaustive();
}

export { DeckDetailData };
export type { DeckDetailContent };
