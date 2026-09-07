import { useCallback, useMemo, useState } from "react";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { CardSummary } from "@/features/catalog/card/card-summary";
import type { DeckLister } from "@/features/deck/deck/deck-lister";
import type { DeckSaver } from "@/features/deck/deck/deck-saver";
import { createDeck } from "@/features/deck/deck/use-cases/create-deck";
import { setDeckCardQuantity } from "@/features/deck/deck/use-cases/set-deck-card-quantity";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";

import { deckBuildSteps, draftEntries, type DeckBuildDraft } from "../deck-build-steps";

interface DeckBuildCapabilities {
  readonly clock: Clock;
  readonly deckFinder: DeckFinder;
  readonly deckLister: DeckLister;
  readonly deckSaver: DeckSaver;
  readonly idGenerator: IdGenerator;
}

function useDeckBuild(capabilities: DeckBuildCapabilities, onSaved: (deckId: string) => void) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<DeckBuildDraft>({
    name: "",
    legend: null,
    chosenChampion: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const step = deckBuildSteps[stepIndex] ?? deckBuildSteps[0];
  const isLastStep = stepIndex === deckBuildSteps.length - 1;

  const back = useCallback(() => setStepIndex((index) => Math.max(0, index - 1)), []);
  const next = useCallback(
    () => setStepIndex((index) => Math.min(deckBuildSteps.length - 1, index + 1)),
    [],
  );
  const goToStep = useCallback((index: number) => setStepIndex(index), []);

  const pickLegend = useCallback((legend: CardSummary | null) => {
    setDraft((current) => ({ ...current, legend }));
  }, []);
  const pickChampion = useCallback((chosenChampion: CardSummary | null) => {
    setDraft((current) => ({ ...current, chosenChampion }));
  }, []);
  const changeName = useCallback((name: string) => {
    setDraft((current) => ({ ...current, name }));
    setError(null);
  }, []);

  const entries = useMemo(() => draftEntries(draft), [draft]);

  const save = useCallback(async () => {
    const name = draft.name.trim();
    if (name.length === 0) {
      setError("Give the deck a name.");
      return;
    }

    setIsSaving(true);
    const created = await createDeck(name, capabilities);
    const outcome = await match(created)
      .with({ type: "nameTaken" }, () => Promise.resolve("You already have a deck with that name."))
      .with({ type: "saveFailed" }, () => Promise.resolve("Could not save the deck. Try again."))
      .with({ type: "success" }, async ({ deck }) => {
        for (const entry of entries) {
          const result = await setDeckCardQuantity(deck.id, entry, capabilities);
          if (result.type !== "success") return "Could not save the deck. Try again.";
        }
        onSaved(deck.id);
        return null;
      })
      .exhaustive();

    setIsSaving(false);
    setError(outcome);
  }, [capabilities, draft.name, entries, onSaved]);

  return {
    back,
    changeName,
    draft,
    error,
    goToStep,
    isLastStep,
    isSaving,
    next,
    pickChampion,
    pickLegend,
    save,
    step,
    stepIndex,
  };
}

export { useDeckBuild };
export type { DeckBuildCapabilities };
