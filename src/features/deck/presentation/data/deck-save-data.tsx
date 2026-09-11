import { useQueryClient } from "@tanstack/react-query";
import { useCallback, type ReactNode } from "react";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import type { CardId } from "@/features/card/value-objects/card-id";
import type { DeckEntry, DeckVerification } from "@/features/deck/deck/deck";
import type { DeckDraft, SaveDeckResult } from "@/features/deck/deck/use-cases/save-deck";
import { deckKeys } from "@/features/deck/presentation/queries/deck-keys";
import { saveDeckMutation } from "@/features/deck/presentation/queries/deck-queries";
import { useWriteState, type WriteState } from "@/hooks/use-write-state";

import { BuildFooter } from "../components/build/build-footer";
import type { DeckBuildCapabilities, DeckBuildStart } from "../deck-build-start";
import { saveReadinessLabel } from "../deck-legality-format";

type DeckSaveState = WriteState<SaveDeckResult>;

type SaveFooterMessage =
  | { readonly type: "failure"; readonly message: string }
  | { readonly type: "readiness"; readonly message: string };

interface DeckSaveDraft {
  readonly chosenChampionCardId: CardId | null;
  readonly entries: readonly DeckEntry[];
  readonly name: string;
  readonly verification: DeckVerification;
}

interface DeckSaveControls {
  changeName(name: string): void;
}

/**
 * Owns the save's execution lifecycle and renders the save control, so the zones step below it
 * receives a name-edit callback and never a write state.
 */
function DeckSaveData({
  capabilities,
  children,
  draft,
  onChangeName,
  onSaved,
  start,
}: {
  readonly capabilities: DeckBuildCapabilities;
  readonly children: (controls: DeckSaveControls) => ReactNode;
  readonly draft: DeckSaveDraft;
  readonly onChangeName: (name: string) => void;
  readonly onSaved: () => void;
  readonly start: DeckBuildStart;
}) {
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

  const { chosenChampionCardId, entries, name, verification } = draft;
  const save = useCallback(() => {
    submit({ ...deckIdentity(start, capabilities), chosenChampionCardId, entries, name });
  }, [capabilities, chosenChampionCardId, entries, name, start, submit]);

  return (
    <>
      {children({ changeName })}

      <BuildFooter actionLabel={saveActionLabel(state)} onAction={save}>
        {match(footerMessage(state, verification))
          .with({ type: "failure" }, ({ message }) => (
            <ThemedText numberOfLines={2} themeColor="negative" type="body">
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

function footerMessage(state: DeckSaveState, verification: DeckVerification): SaveFooterMessage {
  return match<DeckSaveState, SaveFooterMessage>(state)
    .with({ type: "failed" }, () => ({
      type: "failure",
      message: "Could not save the deck. Try again.",
    }))
    .with({ type: "nameMissing" }, () => ({
      type: "failure",
      message: "Give the deck a name.",
    }))
    .with({ type: "nameTaken" }, () => ({
      type: "failure",
      message: "You already have a deck with that name.",
    }))
    .with({ type: "copyLimitExceeded" }, ({ violations }) => ({
      type: "failure",
      message: violations[0]?.message ?? "Too many copies of a card.",
    }))
    .with({ type: "idle" }, { type: "saving" }, { type: "success" }, () => ({
      type: "readiness",
      message: saveReadinessLabel(verification),
    }))
    .exhaustive();
}

export { DeckSaveData };
export type { DeckSaveControls, DeckSaveDraft };
