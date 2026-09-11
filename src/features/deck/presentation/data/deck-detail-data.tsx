import { useCallback, type ReactNode } from "react";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { Card } from "@/features/card/card";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";
import { listCardsByPrintingIdsQuery } from "@/features/card/presentation/queries/card-queries";
import type { ListCardsResult } from "@/features/card/use-cases/list-cards";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { Deck, DeckId } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";
import type { FindDeckResult } from "@/features/deck/deck/use-cases/find-deck";
import { getDeckQuery } from "@/features/deck/presentation/queries/deck-queries";
import { useReadState, type ReadState } from "@/hooks/use-read-state";

interface DeckDetailContent {
  readonly cards: readonly Card[];
  readonly deck: Deck;
  reload(): void;
}

type DeckDetailState =
  | { readonly type: "loading" }
  | { readonly type: "failed"; readonly error: unknown }
  | { readonly type: "notFound" }
  | { readonly type: "success"; readonly cards: readonly Card[]; readonly deck: Deck };

function DeckDetailData({
  cardCounter,
  cardLister,
  children,
  deckFinder,
  deckId,
}: {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly children: (content: DeckDetailContent) => ReactNode;
  readonly deckFinder: DeckFinder;
  readonly deckId: DeckId;
}) {
  const { reload: reloadDeck, state: deckState } = useReadState(
    getDeckQuery(deckId, { deckFinder }),
  );
  const printingIds = seatedPrintingIds(deckState);
  const { reload: reloadCards, state: cardsState } = useReadState({
    ...listCardsByPrintingIdsQuery(printingIds, { cardCounter, cardLister }),
    enabled: printingIds.length > 0,
  });

  const reload = useCallback(() => {
    reloadDeck();
    reloadCards();
  }, [reloadCards, reloadDeck]);

  return match(deckDetailState(deckState, cardsState))
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "failed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="secondary" />}
        message="Could not load the deck."
      />
    ))
    .with({ type: "notFound" }, () => <ErrorState message="That deck no longer exists." />)
    .with({ type: "success" }, ({ cards, deck }) => children({ cards, deck, reload }))
    .exhaustive();
}

function seatedPrintingIds(deckState: ReadState<FindDeckResult>): readonly PrintingId[] {
  return match(deckState)
    .with({ type: "success" }, ({ deck }) => [
      ...new Set(deck.entries.map((entry) => entry.printingId)),
    ])
    .with({ type: "loading" }, { type: "failed" }, { type: "notFound" }, () => [])
    .exhaustive();
}

function deckDetailState(
  deckState: ReadState<FindDeckResult>,
  cardsState: ReadState<ListCardsResult>,
): DeckDetailState {
  return match(deckState)
    .with(
      { type: "loading" },
      { type: "failed" },
      { type: "notFound" },
      (unresolved): DeckDetailState => unresolved,
    )
    .with({ type: "success" }, ({ deck }): DeckDetailState =>
      deck.entries.length === 0
        ? { type: "success", cards: [], deck }
        : deckCardsState(deck, cardsState),
    )
    .exhaustive();
}

function deckCardsState(deck: Deck, cardsState: ReadState<ListCardsResult>): DeckDetailState {
  return match(cardsState)
    .with({ type: "loading" }, { type: "failed" }, (unresolved): DeckDetailState => unresolved)
    .with({ type: "success" }, ({ page }): DeckDetailState => ({
      type: "success",
      cards: page.items,
      deck,
    }))
    .exhaustive();
}

export { DeckDetailData };
export type { DeckDetailContent };
