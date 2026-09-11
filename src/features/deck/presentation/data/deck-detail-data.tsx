import { useCallback, type ReactNode } from "react";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { Card } from "@/features/card/card";
import type { CardLister } from "@/features/card/card-lister";
import type { Deck, DeckId } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";
import { findDeck } from "@/features/deck/deck/use-cases/find-deck";
import { type AsyncRun, useAsyncResult } from "@/hooks/use-async-result";
import { throwIfAborted } from "@/shared/read-options";

const CARD_LOOKUP_LIMIT = 100;

interface DeckDetailContent {
  readonly cards: readonly Card[];
  readonly deck: Deck;
  reload(): void;
}

type DeckDetailOutcome =
  | { readonly type: "notFound" }
  | { readonly type: "loadFailed" }
  | { readonly type: "success"; readonly deck: Deck; readonly cards: readonly Card[] };

function DeckDetailData({
  cardLister,
  children,
  deckFinder,
  deckId,
}: {
  readonly cardLister: CardLister;
  readonly children: (content: DeckDetailContent) => ReactNode;
  readonly deckFinder: DeckFinder;
  readonly deckId: DeckId;
}) {
  const run = useCallback<AsyncRun<DeckDetailOutcome>>(
    async (options) => {
      const found = await findDeck(deckId, { deckFinder }, options);

      return match(found)
        .with({ type: "notFound" }, () => ({ type: "notFound" }) as const)
        .with({ type: "loadFailed" }, () => ({ type: "loadFailed" }) as const)
        .with({ type: "success" }, async ({ deck }) => {
          const printingIds = [...new Set(deck.entries.map((entry) => entry.printingId))];
          if (!printingIds.length) return { type: "success", deck, cards: [] } as const;

          try {
            const page = await cardLister.getPage(
              { printingIds, limit: CARD_LOOKUP_LIMIT },
              options,
            );
            return { type: "success", deck, cards: page.items } as const;
          } catch {
            throwIfAborted(options.signal);
            return { type: "loadFailed" } as const;
          }
        })
        .exhaustive();
    },
    [cardLister, deckFinder, deckId],
  );
  const { reload, result } = useAsyncResult(run);

  return match(result)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "notFound" }, () => <ErrorState message="That deck no longer exists." />)
    .with({ type: "loadFailed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="secondary" />}
        message="Could not load the deck."
      />
    ))
    .with({ type: "success" }, ({ cards, deck }) => children({ cards, deck, reload }))
    .exhaustive();
}

export { DeckDetailData };
export type { DeckDetailContent };
