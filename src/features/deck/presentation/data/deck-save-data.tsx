import { useQueryClient } from "@tanstack/react-query";
import { useCallback, type ReactNode } from "react";
import { match } from "ts-pattern";

import type { ChosenChampion, DeckEntry, DeckVerification } from "@/features/deck/deck/deck";
import type { DeckDraft } from "@/features/deck/deck/use-cases/save-deck";
import { deckKeys } from "@/features/deck/queries/deck-keys";
import { saveDeckMutation } from "@/features/deck/queries/deck-queries";
import { useAnnouncement } from "@/hooks/use-announcement";
import { useWriteState } from "@/hooks/use-write-state";

import type { DeckBuildCapabilities, DeckBuildMode } from "../deck-build-mode";
import {
  footerMessage,
  refusalMessage,
  SAVE_FAILED_MESSAGE,
  saveActionLabel,
  type SaveFooterMessage,
} from "../deck-save-format";

const SAVED_MESSAGE = "Deck saved.";

interface DeckSaveRequest {
  readonly chosenChampion: ChosenChampion | null;
  readonly entries: readonly DeckEntry[];
  readonly name: string;
  readonly verification: DeckVerification;
}

interface DeckSaveAction {
  readonly isBusy: boolean;
  readonly isEnabled: boolean;
  readonly label: string;
  readonly message: SaveFooterMessage;
  save(): void;
}

interface DeckSaveControls {
  readonly saveAction: DeckSaveAction;
  changeName(name: string): void;
}

/**
 * Owns the save's execution lifecycle and hands down a name-edit callback and a described save
 * action, so the sections step below it never receives a write state.
 */
function DeckSaveData({
  capabilities,
  children,
  mode,
  onChangeName,
  onSaved,
  request,
}: {
  readonly capabilities: DeckBuildCapabilities;
  readonly children: (controls: DeckSaveControls) => ReactNode;
  readonly mode: DeckBuildMode;
  readonly onChangeName: (name: string) => void;
  readonly onSaved: () => void;
  readonly request: DeckSaveRequest;
}) {
  const queryClient = useQueryClient();
  const announce = useAnnouncement();
  const { reset, state, submit } = useWriteState({
    ...saveDeckMutation(capabilities),
    onError: () => announce(SAVE_FAILED_MESSAGE, "interrupting"),
    onSuccess: (result) =>
      match(result)
        .with({ type: "success" }, () => {
          void queryClient.invalidateQueries({ queryKey: deckKeys.all() });
          announce(SAVED_MESSAGE);
          onSaved();
        })
        .with(
          { type: "nameMissing" },
          { type: "nameTaken" },
          { type: "copyLimitExceeded" },
          (refusal) => announce(refusalMessage(refusal), "interrupting"),
        )
        .exhaustive(),
  });

  const changeName = useCallback(
    (name: string) => {
      onChangeName(name);
      match(state)
        .with(
          { type: "failed" },
          { type: "nameMissing" },
          { type: "nameTaken" },
          { type: "copyLimitExceeded" },
          () => reset(),
        )
        .with({ type: "idle" }, { type: "saving" }, { type: "success" }, () => undefined)
        .exhaustive();
    },
    [onChangeName, reset, state],
  );

  const { chosenChampion, entries, name, verification } = request;
  const save = useCallback(() => {
    submit({ ...deckIdentity(mode, capabilities), chosenChampion, entries, name });
  }, [capabilities, chosenChampion, entries, mode, name, submit]);

  return children({
    changeName,
    saveAction: {
      isBusy: state.type === "saving",
      isEnabled: state.type !== "saving",
      label: saveActionLabel(state),
      message: footerMessage(state, verification),
      save,
    },
  });
}

function deckIdentity(
  mode: DeckBuildMode,
  { clock, idGenerator }: DeckBuildCapabilities,
): Pick<DeckDraft, "id" | "createdAt"> {
  return match(mode)
    .with({ type: "create" }, () => ({
      id: idGenerator.next(),
      createdAt: clock.now(),
    }))
    .with({ type: "edit" }, ({ resolvedDeck }) => ({
      id: resolvedDeck.deck.id,
      createdAt: resolvedDeck.deck.createdAt,
    }))
    .exhaustive();
}

export { DeckSaveData };
export type { DeckSaveAction, DeckSaveControls, DeckSaveRequest };
