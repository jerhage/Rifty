import { useCallback, useMemo, useState } from "react";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { Card } from "@/features/catalog/card/card";
import type { CardDomain } from "@/features/catalog/value-objects/card-domain";
import type { CardType } from "@/features/catalog/value-objects/card-type";
import type { Deck, DeckSection } from "@/features/deck/deck/deck";
import type { DeckLister } from "@/features/deck/deck/deck-lister";
import type { DeckSaver } from "@/features/deck/deck/deck-saver";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";
import { saveDeck } from "@/features/deck/deck/use-cases/save-deck";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import {
  DECK_BUILD_STEPS,
  draftEntries,
  draftFromDeck,
  EMPTY_DRAFT,
  quantityKey,
  type DeckBuildDraft,
} from "../deck-build-steps";
import {
  defaultPoolFilters,
  type ZonePoolFilters,
  type ZonePoolLayout,
  type ZonePoolView,
} from "../deck-zone-pool";

const SEARCH_DEBOUNCE_MS = 300;

interface DeckBuildCapabilities {
  readonly clock: Clock;
  readonly deckLister: DeckLister;
  readonly deckSaver: DeckSaver;
  readonly idGenerator: IdGenerator;
}

type DeckBuildStart =
  | { readonly type: "new" }
  | { readonly type: "edit"; readonly deck: Deck; readonly cards: readonly Card[] };

const ZONES_STEP_INDEX = DECK_BUILD_STEPS.findIndex((step) => step.id === "zones");

function useDeckBuild(
  start: DeckBuildStart,
  capabilities: DeckBuildCapabilities,
  onSaved: () => void,
) {
  const [stepIndex, setStepIndex] = useState(() => (start.type === "edit" ? ZONES_STEP_INDEX : 0));
  const [draft, setDraft] = useState<DeckBuildDraft>(() => initialDraft(start));
  const [zone, setZoneState] = useState<DeckSection>("mainDeck");
  const [poolFilters, setPoolFilters] = useState<ZonePoolFilters>(() =>
    defaultPoolFilters(initialDraft(start).legend),
  );
  const [poolLayout, setPoolLayout] = useState<ZonePoolLayout>("list");
  const [poolView, setPoolView] = useState<ZonePoolView>("pool");
  const [legendQuery, setLegendQuery] = useState("");
  const [legendDomainIds, setLegendDomainIds] = useState<readonly CardDomain[]>([]);
  const [isPoolFilterOpen, setIsPoolFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const step = DECK_BUILD_STEPS[stepIndex] ?? DECK_BUILD_STEPS[0];

  const back = useCallback(() => setStepIndex((index) => Math.max(0, index - 1)), []);

  /** The zones step opens on the legend's own domains rather than the whole catalog. */
  const goToStep = useCallback(
    (index: number) => {
      setStepIndex(index);
      if (DECK_BUILD_STEPS[index]?.id === "zones") {
        setPoolFilters(defaultPoolFilters(draft.legend));
      }
    },
    [draft.legend],
  );
  const next = useCallback(
    () => goToStep(Math.min(DECK_BUILD_STEPS.length - 1, stepIndex + 1)),
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
  const toggleLegendDomain = useCallback((domainId: CardDomain) => {
    setLegendDomainIds((current) => toggle(current, domainId));
  }, []);
  const openPoolFilters = useCallback(() => setIsPoolFilterOpen(true), []);
  const dismissPoolFilters = useCallback(() => setIsPoolFilterOpen(false), []);
  const resetPoolFilters = useCallback(() => {
    setPoolFilters((current) => ({ ...defaultPoolFilters(draft.legend), query: current.query }));
  }, [draft.legend]);

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

  /** The field updates on every keystroke; the pool query waits for a pause in typing. */
  const debouncedQuery = useDebouncedValue(poolFilters.query, SEARCH_DEBOUNCE_MS);
  const debouncedLegendQuery = useDebouncedValue(legendQuery, SEARCH_DEBOUNCE_MS);
  const poolQueryFilters = useMemo(
    () => ({ ...poolFilters, query: debouncedQuery }),
    [debouncedQuery, poolFilters],
  );

  const entries = useMemo(() => draftEntries(draft), [draft]);

  /** Judged against a stand-in deck: the draft is not saved yet, so it has no identity. */
  const verification = useMemo(
    () =>
      verifyDeck(
        {
          id: "draft",
          name: draft.name || "Draft",
          notes: "",
          createdAt: "1970-01-01T00:00:00.000Z",
          updatedAt: "1970-01-01T00:00:00.000Z",
          entries,
        },
        RIFTBOUND_STANDARD,
      ),
    [draft.name, entries],
  );

  const save = useCallback(async () => {
    const name = draft.name.trim();
    if (name.length === 0) {
      setError("Give the deck a name.");
      return;
    }

    setIsSaving(true);
    const result = await saveDeck(
      {
        id: start.type === "edit" ? start.deck.id : capabilities.idGenerator.next(),
        name,
        notes: start.type === "edit" ? start.deck.notes : "",
        createdAt: start.type === "edit" ? start.deck.createdAt : capabilities.clock.now(),
        entries,
      },
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
  }, [capabilities, draft.name, entries, onSaved, start]);

  return {
    back,
    changeName,
    draft,
    error,
    goToStep,
    isPoolFilterOpen,
    isSaving,
    next,
    openPoolFilters,
    pickChampion,
    pickLegend,
    debouncedLegendQuery,
    dismissPoolFilters,
    legendDomainIds,
    legendQuery,
    poolFilters,
    poolLayout,
    poolQueryFilters,
    poolView,
    setLegendQuery,
    resetPoolFilters,
    save,
    setPoolLayout,
    setPoolQuery,
    setPoolView,
    setQuantity,
    setZone,
    step,
    stepIndex,
    verification,
    toggleLegendDomain,
    togglePoolDomain,
    togglePoolType,
    zone,
  };
}

function initialDraft(start: DeckBuildStart): DeckBuildDraft {
  return start.type === "edit" ? draftFromDeck(start.deck, start.cards) : EMPTY_DRAFT;
}

function toggle<Value>(values: readonly Value[], value: Value): Value[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

export { useDeckBuild };
export type { DeckBuildCapabilities, DeckBuildStart };
