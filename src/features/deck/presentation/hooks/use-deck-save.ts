import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { match } from "ts-pattern";

import type { DeckDraft } from "@/features/deck/deck/use-cases/save-deck";
import { deckKeys } from "@/features/deck/presentation/queries/deck-keys";
import { saveDeckMutation } from "@/features/deck/presentation/queries/deck-queries";
import { useWriteState } from "@/hooks/use-write-state";

import type { DeckBuildCapabilities, DeckBuildStart } from "../deck-build-start";

type DeckSaveRequest = Omit<DeckDraft, "id" | "notes" | "createdAt">;

function useDeckSave(
  start: DeckBuildStart,
  capabilities: DeckBuildCapabilities,
  { onSaved }: { readonly onSaved: () => void },
) {
  const queryClient = useQueryClient();
  const { reset, state, submit } = useWriteState({
    ...saveDeckMutation(capabilities),
    onSuccess: (result) =>
      match(result)
        .with({ type: "success" }, () => {
          void queryClient.invalidateQueries({ queryKey: deckKeys.all() });
          onSaved();
        })
        .with(
          { type: "nameMissing" },
          { type: "nameTaken" },
          { type: "copyLimitExceeded" },
          () => undefined,
        )
        .exhaustive(),
  });

  const clearFailure = useCallback(
    () =>
      match(state)
        .with(
          { type: "failed" },
          { type: "nameMissing" },
          { type: "nameTaken" },
          { type: "copyLimitExceeded" },
          () => reset(),
        )
        .with({ type: "idle" }, { type: "saving" }, { type: "success" }, () => undefined)
        .exhaustive(),
    [reset, state],
  );

  const save = useCallback(
    (request: DeckSaveRequest) => {
      submit({ ...deckIdentity(start, capabilities), ...request });
    },
    [capabilities, start, submit],
  );

  return { clearFailure, save, state };
}

function deckIdentity(
  start: DeckBuildStart,
  { clock, idGenerator }: DeckBuildCapabilities,
): Pick<DeckDraft, "id" | "notes" | "createdAt"> {
  return match(start)
    .with({ type: "new" }, () => ({
      id: idGenerator.next(),
      notes: "",
      createdAt: clock.now(),
    }))
    .with({ type: "edit" }, ({ resolvedDeck }) => ({
      id: resolvedDeck.deck.id,
      notes: resolvedDeck.deck.notes,
      createdAt: resolvedDeck.deck.createdAt,
    }))
    .exhaustive();
}

export { useDeckSave };
export type { DeckSaveRequest };
