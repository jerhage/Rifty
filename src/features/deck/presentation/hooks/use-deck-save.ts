import { useCallback, useState } from "react";
import { match } from "ts-pattern";

import { saveDeck, type DeckDraft } from "@/features/deck/deck/use-cases/save-deck";

import type { DeckBuildCapabilities, DeckBuildStart } from "../deck-build-start";

type DeckSaveRequest = Omit<DeckDraft, "id" | "notes" | "createdAt">;

function useDeckSave(
  start: DeckBuildStart,
  capabilities: DeckBuildCapabilities,
  { onSaved }: { readonly onSaved: () => void },
) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const save = useCallback(
    async (request: DeckSaveRequest) => {
      const name = request.name.trim();
      if (name.length === 0) {
        setError("Give the deck a name.");
        return;
      }

      setIsSaving(true);
      const result = await saveDeck(
        { ...deckIdentity(start, capabilities), ...request, name },
        capabilities,
      );
      const failure = match(result)
        .with({ type: "nameTaken" }, () => "You already have a deck with that name.")
        .with(
          { type: "copyLimitExceeded" },
          ({ violations }) => violations[0]?.message ?? "Too many copies of a card.",
        )
        .with({ type: "saveFailed" }, () => "Could not save the deck. Try again.")
        .with({ type: "success" }, () => null)
        .exhaustive();

      setIsSaving(false);
      setError(failure);
      if (failure === null) onSaved();
    },
    [capabilities, onSaved, start],
  );

  return { clearError, error, isSaving, save };
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
export type { DeckSaveRequest };
