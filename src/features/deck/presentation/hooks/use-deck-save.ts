import { useCallback, useState } from "react";
import { match } from "ts-pattern";

import { saveDeck, type DeckDraft } from "@/features/deck/deck/use-cases/save-deck";

import type { DeckBuildCapabilities, DeckBuildStart } from "../deck-build-start";

type DeckSaveRequest = Omit<DeckDraft, "id" | "notes" | "createdAt">;

type DeckSaveStatus =
  | { readonly type: "idle" }
  | { readonly type: "saving" }
  | { readonly type: "failed"; readonly message: string };

const IDLE_SAVE: DeckSaveStatus = { type: "idle" };

function useDeckSave(
  start: DeckBuildStart,
  capabilities: DeckBuildCapabilities,
  { onSaved }: { readonly onSaved: () => void },
) {
  const [status, setStatus] = useState<DeckSaveStatus>(IDLE_SAVE);

  const clearFailure = useCallback(
    () =>
      setStatus((current) =>
        match(current)
          .with({ type: "failed" }, () => IDLE_SAVE)
          .with({ type: "idle" }, { type: "saving" }, (kept) => kept)
          .exhaustive(),
      ),
    [],
  );

  const save = useCallback(
    async (request: DeckSaveRequest) => {
      const name = request.name.trim();
      if (name.length === 0) {
        setStatus({ type: "failed", message: "Give the deck a name." });
        return;
      }

      setStatus({ type: "saving" });
      const result = await saveDeck(
        { ...deckIdentity(start, capabilities), ...request, name },
        capabilities,
      );

      match(result)
        .with({ type: "success" }, () => {
          setStatus(IDLE_SAVE);
          onSaved();
        })
        .with({ type: "nameTaken" }, () =>
          setStatus({ type: "failed", message: "You already have a deck with that name." }),
        )
        .with({ type: "copyLimitExceeded" }, ({ violations }) =>
          setStatus({
            type: "failed",
            message: violations[0]?.message ?? "Too many copies of a card.",
          }),
        )
        .with({ type: "saveFailed" }, () =>
          setStatus({ type: "failed", message: "Could not save the deck. Try again." }),
        )
        .exhaustive();
    },
    [capabilities, onSaved, start],
  );

  return { clearFailure, save, status };
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
    .with({ type: "edit" }, ({ deck }) => ({
      id: deck.id,
      notes: deck.notes,
      createdAt: deck.createdAt,
    }))
    .exhaustive();
}

export { useDeckSave };
export type { DeckSaveRequest, DeckSaveStatus };
