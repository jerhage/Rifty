import type { ReactNode } from "react";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ErrorState } from "@/components/ui/atoms/error-state";
import { LoadingState } from "@/components/ui/atoms/loading-state";
import type { Deck } from "@/features/deck/deck/deck";
import type { DeckLister } from "@/features/deck/deck/deck-lister";
import { listDecks, type ListDecksResult } from "@/features/deck/deck/use-cases/list-decks";
import { useAsyncResult } from "@/hooks/use-async-result";
import type { ReadOptions } from "@/shared/read-options";

interface DecksDataContent {
  readonly decks: readonly Deck[];
  reload(): void;
}

interface DecksDataProps {
  readonly children: (content: DecksDataContent) => ReactNode;
  readonly deckLister: DeckLister;
}

function DecksData({ children, deckLister }: DecksDataProps) {
  const { reload, result } = useAsyncResult<ListDecksResult>(
    (options: ReadOptions) => listDecks({ deckLister }, options),
    [deckLister],
  );

  return match(result)
    .with({ type: "loading" }, () => <LoadingState />)
    .with({ type: "listFailed" }, () => (
      <ErrorState
        action={<Button label="Try again" onPress={reload} variant="secondary" />}
        message="Could not load your decks."
      />
    ))
    .with({ type: "success" }, ({ decks }) => children({ decks, reload }))
    .exhaustive();
}

export { DecksData };
export type { DecksDataContent };
