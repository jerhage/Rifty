import { useCallback, useMemo, useState } from "react";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import type { Card } from "@/features/card/card";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { Deck, DeckSection } from "@/features/deck/deck/deck";
import type { DeckLister } from "@/features/deck/deck/deck-lister";
import type { DeckSaver } from "@/features/deck/deck/deck-saver";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";
import { saveDeck, type DeckDraft } from "@/features/deck/deck/use-cases/save-deck";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { minimumForCard } from "../deck-build-allowance";

import {
  chooseChampion,
  DECK_BUILD_STEPS,
  draftEntries,
  draftFromDeck,
  EMPTY_DRAFT,
  withZoneCard,
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

type DeckBuildMode = DeckBuildStart["type"];

const ZONES_STEP_INDEX = DECK_BUILD_STEPS.findIndex((step) => step.id === "zones");

function useDeckBuild(
  start: DeckBuildStart,
  capabilities: DeckBuildCapabilities,
  { onExit, onSaved }: { readonly onExit: () => void; readonly onSaved: () => void },
) {
  const [stepIndex, setStepIndex] = useState(() => openingStep(start));
  const [draft, setDraft] = useState<DeckBuildDraft>(() => openingDraft(start));
  const [zone, setZoneState] = useState<DeckSection>("mainDeck");
  const [poolFilters, setPoolFilters] = useState<ZonePoolFilters>(() =>
    defaultPoolFilters(openingDraft(start).legend),
  );
  const [draftPoolFilters, setDraftPoolFilters] = useState<ZonePoolFilters>(() =>
    defaultPoolFilters(openingDraft(start).legend),
  );
  const [poolQuery, setPoolQuery] = useState("");
  const [poolLayout, setPoolLayout] = useState<ZonePoolLayout>("list");
  const [poolView, setPoolView] = useState<ZonePoolView>("pool");
  const [legendQuery, setLegendQuery] = useState("");
  const [legendDomainIds, setLegendDomainIds] = useState<readonly CardDomain[]>([]);
  const [isPoolFilterOpen, setIsPoolFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const step = DECK_BUILD_STEPS[stepIndex] ?? DECK_BUILD_STEPS[0];

  const back = useCallback(() => {
    if (stepIndex === 0) {
      onExit();
      return;
    }

    setStepIndex(stepIndex - 1);
  }, [onExit, stepIndex]);

  const settlePoolFilters = useCallback((filters: ZonePoolFilters) => {
    setPoolFilters(filters);
    setDraftPoolFilters(filters);
  }, []);

  /** The zones step opens on the legend's own domains rather than the whole catalog. */
  const goToStep = useCallback(
    (index: number) => {
      setStepIndex(index);
      if (DECK_BUILD_STEPS[index]?.id === "zones") {
        settlePoolFilters(defaultPoolFilters(draft.legend));
        setPoolQuery("");
      }
    },
    [draft.legend, settlePoolFilters],
  );
  const next = useCallback(
    () => goToStep(Math.min(DECK_BUILD_STEPS.length - 1, stepIndex + 1)),
    [goToStep, stepIndex],
  );

  /** Each zone draws from a different pool, so its filters do not carry across. */
  const setZone = useCallback(
    (section: DeckSection) => {
      setZoneState(section);
      settlePoolFilters(defaultPoolFilters(draft.legend));
      setPoolQuery("");
    },
    [draft.legend, settlePoolFilters],
  );

  const togglePoolDomain = useCallback((domainId: CardDomain) => {
    setDraftPoolFilters((current) => ({
      ...current,
      domainIds: toggle(current.domainIds, domainId),
    }));
  }, []);
  const togglePoolKeyword = useCallback((keywordId: string) => {
    setDraftPoolFilters((current) => ({
      ...current,
      keywordIds: toggle(current.keywordIds, keywordId),
    }));
  }, []);
  const togglePoolType = useCallback((typeId: CardType) => {
    setDraftPoolFilters((current) => ({ ...current, typeIds: toggle(current.typeIds, typeId) }));
  }, []);
  const toggleLegendDomain = useCallback((domainId: CardDomain) => {
    setLegendDomainIds((current) => toggle(current, domainId));
  }, []);
  const openPoolFilters = useCallback(() => {
    setDraftPoolFilters(poolFilters);
    setIsPoolFilterOpen(true);
  }, [poolFilters]);
  const dismissPoolFilters = useCallback(() => {
    setDraftPoolFilters(poolFilters);
    setIsPoolFilterOpen(false);
  }, [poolFilters]);
  const applyPoolFilters = useCallback(() => {
    setPoolFilters(draftPoolFilters);
    setIsPoolFilterOpen(false);
  }, [draftPoolFilters]);
  const resetPoolFilters = useCallback(() => {
    setDraftPoolFilters(defaultPoolFilters(draft.legend));
  }, [draft.legend]);

  /** Changing the legend clears the champion, whose tag and domains have to match it. */
  const pickLegend = useCallback((legend: Card) => {
    setDraft((current) =>
      current.legend?.printingId === legend.printingId
        ? { ...current, legend: null }
        : { ...current, legend, chosenChampion: null },
    );
  }, []);

  const pickChampion = useCallback((champion: Card) => {
    setDraft((current) =>
      current.chosenChampion?.printingId === champion.printingId
        ? { ...current, chosenChampion: null }
        : chooseChampion(current, champion),
    );
  }, []);

  const changeName = useCallback((name: string) => {
    setDraft((current) => ({ ...current, name }));
    setError(null);
  }, []);

  const setQuantity = useCallback((section: DeckSection, card: Card, quantity: number) => {
    setDraft((current) =>
      withZoneCard(current, section, card.printingId, {
        card,
        quantity: Math.max(minimumForCard(current, section, card), quantity),
      }),
    );
  }, []);

  /** The field updates on every keystroke; the pool query waits for a pause in typing. */
  const debouncedPoolQuery = useDebouncedValue(poolQuery, SEARCH_DEBOUNCE_MS);
  const debouncedLegendQuery = useDebouncedValue(legendQuery, SEARCH_DEBOUNCE_MS);

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
          chosenChampionCardId: draft.chosenChampion?.cardId ?? null,
          entries,
        },
        RIFTBOUND_STANDARD,
      ),
    [draft.chosenChampion, draft.name, entries],
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
        ...deckIdentity(start, capabilities),
        name,
        chosenChampionCardId: draft.chosenChampion?.cardId ?? null,
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
  }, [capabilities, draft.chosenChampion, draft.name, entries, onSaved, start]);

  return {
    applyPoolFilters,
    back,
    changeName,
    draft,
    draftPoolFilters,
    error,
    goToStep,
    mode: start.type,
    isPoolFilterOpen,
    isSaving,
    next,
    openPoolFilters,
    pickChampion,
    pickLegend,
    debouncedLegendQuery,
    debouncedPoolQuery,
    dismissPoolFilters,
    legendDomainIds,
    legendQuery,
    poolFilters,
    poolLayout,
    poolQuery,
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
    togglePoolKeyword,
    togglePoolType,
    zone,
  };
}

function openingDraft(start: DeckBuildStart): DeckBuildDraft {
  return match(start)
    .with({ type: "new" }, () => EMPTY_DRAFT)
    .with({ type: "edit" }, ({ cards, deck }) => draftFromDeck(deck, cards))
    .exhaustive();
}

function openingStep(start: DeckBuildStart): number {
  return match(start)
    .with({ type: "new" }, () => 0)
    .with({ type: "edit" }, () => ZONES_STEP_INDEX)
    .exhaustive();
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

function toggle<Value>(values: readonly Value[], value: Value): Value[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

export { useDeckBuild };
export type { DeckBuildCapabilities, DeckBuildMode, DeckBuildStart };
