import { useCallback, useMemo, useState } from "react";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { Card } from "@/features/catalog/card/card";
import type { CardDomain } from "@/features/catalog/value-objects/card-domain";
import type { CardType } from "@/features/catalog/value-objects/card-type";
import type { DeckSection } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";
import type { DeckLister } from "@/features/deck/deck/deck-lister";
import type { DeckSaver } from "@/features/deck/deck/deck-saver";
import { createDeck } from "@/features/deck/deck/use-cases/create-deck";
import { setDeckCardQuantity } from "@/features/deck/deck/use-cases/set-deck-card-quantity";

import {
  deckBuildSteps,
  draftEntries,
  emptyDraft,
  quantityKey,
  type DeckBuildDraft,
} from "../deck-build-steps";
import { defaultPoolFilters, emptyPoolFilters, type ZonePoolFilters } from "../deck-zone-pool";

interface DeckBuildCapabilities {
  readonly clock: Clock;
  readonly deckFinder: DeckFinder;
  readonly deckLister: DeckLister;
  readonly deckSaver: DeckSaver;
  readonly idGenerator: IdGenerator;
}

function useDeckBuild(capabilities: DeckBuildCapabilities, onSaved: () => void) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<DeckBuildDraft>(emptyDraft);
  const [zone, setZoneState] = useState<DeckSection>("mainDeck");
  const [poolFilters, setPoolFilters] = useState<ZonePoolFilters>(emptyPoolFilters);
  const [isPoolFilterOpen, setIsPoolFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const step = deckBuildSteps[stepIndex] ?? deckBuildSteps[0];

  const back = useCallback(() => setStepIndex((index) => Math.max(0, index - 1)), []);

  /** The zones step opens on the legend's own domains rather than the whole catalog. */
  const goToStep = useCallback(
    (index: number) => {
      setStepIndex(index);
      if (deckBuildSteps[index]?.id === "zones") {
        setPoolFilters(defaultPoolFilters(draft.legend));
      }
    },
    [draft.legend],
  );
  const next = useCallback(
    () => goToStep(Math.min(deckBuildSteps.length - 1, stepIndex + 1)),
    [goToStep, stepIndex],
  );

  /** Each zone draws from a different pool, so its filters do not carry across. */
  const setZone = useCallback(
    (section: DeckSection) => {
      setZoneState(section);
      setPoolFilters(defaultPoolFilters(draft.legend));
    },
    [draft.legend],
  );

  const setPoolQuery = useCallback((query: string) => {
    setPoolFilters((current) => ({ ...current, query }));
  }, []);
  const togglePoolDomain = useCallback((domainId: CardDomain) => {
    setPoolFilters((current) => ({
      ...current,
      domainIds: toggle(current.domainIds, domainId),
    }));
  }, []);
  const togglePoolType = useCallback((typeId: CardType) => {
    setPoolFilters((current) => ({ ...current, typeIds: toggle(current.typeIds, typeId) }));
  }, []);
  const resetPoolFilters = useCallback(() => {
    setPoolFilters((current) => ({ ...defaultPoolFilters(draft.legend), query: current.query }));
  }, [draft.legend]);
  const openPoolFilters = useCallback(() => setIsPoolFilterOpen(true), []);
  const dismissPoolFilters = useCallback(() => setIsPoolFilterOpen(false), []);

  /** Changing the legend clears the champion, whose tag and domains have to match it. */
  const pickLegend = useCallback((legend: Card) => {
    setDraft((current) =>
      current.legend?.id === legend.id
        ? { ...current, legend: null }
        : { ...current, legend, chosenChampion: null },
    );
  }, []);

  const pickChampion = useCallback((chosenChampion: Card) => {
    setDraft((current) => ({
      ...current,
      chosenChampion: current.chosenChampion?.id === chosenChampion.id ? null : chosenChampion,
    }));
  }, []);

  const changeName = useCallback((name: string) => {
    setDraft((current) => ({ ...current, name }));
    setError(null);
  }, []);

  const setQuantity = useCallback((section: DeckSection, card: Card, quantity: number) => {
    setDraft((current) => ({
      ...current,
      zoneCards: {
        ...current.zoneCards,
        [quantityKey(section, card.riftboundId)]: { card, quantity },
      },
    }));
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
    const failure = await match(created)
      .with({ type: "nameTaken" }, () => Promise.resolve("You already have a deck with that name."))
      .with({ type: "saveFailed" }, () => Promise.resolve("Could not save the deck. Try again."))
      .with({ type: "success" }, async ({ deck }) => {
        for (const entry of entries) {
          const result = await setDeckCardQuantity(deck.id, entry, capabilities);
          if (result.type === "copyLimitReached") {
            return `Only ${result.allowed} copies of a card are allowed.`;
          }
          if (result.type !== "success") return "Could not save the deck. Try again.";
        }
        return null;
      })
      .exhaustive();

    setIsSaving(false);
    setError(failure);
    if (failure === null) onSaved();
  }, [capabilities, draft.name, entries, onSaved]);

  return {
    back,
    changeName,
    dismissPoolFilters,
    draft,
    error,
    goToStep,
    isPoolFilterOpen,
    isSaving,
    next,
    openPoolFilters,
    pickChampion,
    pickLegend,
    poolFilters,
    resetPoolFilters,
    save,
    setPoolQuery,
    setQuantity,
    setZone,
    step,
    stepIndex,
    togglePoolDomain,
    togglePoolType,
    zone,
  };
}

function toggle<Value>(values: readonly Value[], value: Value): Value[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

export { useDeckBuild };
export type { DeckBuildCapabilities };
