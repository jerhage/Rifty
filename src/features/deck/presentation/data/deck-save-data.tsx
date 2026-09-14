import { useQueryClient } from "@tanstack/react-query";
import { useCallback, type ReactNode } from "react";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import type { ChosenChampion, DeckEntry, DeckVerification } from "@/features/deck/deck/deck";
import type { DeckDraft, SaveDeckResult } from "@/features/deck/deck/use-cases/save-deck";
import { deckKeys } from "@/features/deck/queries/deck-keys";
import { saveDeckMutation } from "@/features/deck/queries/deck-queries";
import { useAnnouncement } from "@/hooks/use-announcement";
import { useWriteState, type WriteState } from "@/hooks/use-write-state";

import { BuildFooter } from "../components/build/build-footer";
import type { DeckBuildCapabilities, DeckBuildMode } from "../deck-build-mode";
import { saveReadinessLabel } from "../deck-legality-format";

type DeckSaveState = WriteState<SaveDeckResult>;

type SaveRefusal = Exclude<SaveDeckResult, { readonly type: "success" }>;

const SAVE_FAILED_MESSAGE = "Could not save the deck. Try again.";
const SAVED_MESSAGE = "Deck saved.";

type SaveFooterMessage =
  | { readonly type: "failure"; readonly message: string }
  | { readonly type: "readiness"; readonly message: string };

interface DeckSaveRequest {
  readonly chosenChampion: ChosenChampion | null;
  readonly entries: readonly DeckEntry[];
  readonly name: string;
  readonly verification: DeckVerification;
}

interface DeckSaveControls {
  changeName(name: string): void;
}

/**
 * Owns the save's execution lifecycle and renders the save control, so the sections step below it
 * receives a name-edit callback and never a write state.
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

  return (
    <>
      {children({ changeName })}

      <BuildFooter
        actionLabel={saveActionLabel(state)}
        isActionBusy={state.type === "saving"}
        isActionEnabled={state.type !== "saving"}
        onAction={save}
      >
        {match(footerMessage(state, verification))
          .with({ type: "failure" }, ({ message }) => (
            <ThemedText
              accessibilityLiveRegion="assertive"
              accessibilityRole="alert"
              numberOfLines={2}
              themeColor="negative"
              type="body"
            >
              {message}
            </ThemedText>
          ))
          .with({ type: "readiness" }, ({ message }) => (
            <ThemedText numberOfLines={1} themeColor="textSecondary" type="mono">
              {message}
            </ThemedText>
          ))
          .exhaustive()}
      </BuildFooter>
    </>
  );
}

function deckIdentity(
  mode: DeckBuildMode,
  { clock, idGenerator }: DeckBuildCapabilities,
): Pick<DeckDraft, "id" | "notes" | "createdAt"> {
  return match(mode)
    .with({ type: "create" }, () => ({
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

function saveActionLabel(state: DeckSaveState): string {
  return match(state)
    .with({ type: "saving" }, () => "Saving…")
    .with(
      { type: "idle" },
      { type: "failed" },
      { type: "success" },
      { type: "nameMissing" },
      { type: "nameTaken" },
      { type: "copyLimitExceeded" },
      () => "Save deck",
    )
    .exhaustive();
}

function refusalMessage(refusal: SaveRefusal): string {
  return match(refusal)
    .with({ type: "nameMissing" }, () => "Give the deck a name.")
    .with({ type: "nameTaken" }, () => "You already have a deck with that name.")
    .with(
      { type: "copyLimitExceeded" },
      ({ violations }) => violations[0]?.message ?? "Too many copies of a card.",
    )
    .exhaustive();
}

function footerMessage(state: DeckSaveState, verification: DeckVerification): SaveFooterMessage {
  return match<DeckSaveState, SaveFooterMessage>(state)
    .with({ type: "failed" }, () => ({ type: "failure", message: SAVE_FAILED_MESSAGE }))
    .with(
      { type: "nameMissing" },
      { type: "nameTaken" },
      { type: "copyLimitExceeded" },
      (refusal) => ({ type: "failure", message: refusalMessage(refusal) }),
    )
    .with({ type: "idle" }, { type: "saving" }, { type: "success" }, () => ({
      type: "readiness",
      message: saveReadinessLabel(verification),
    }))
    .exhaustive();
}

export { DeckSaveData };
export type { DeckSaveControls, DeckSaveRequest };
