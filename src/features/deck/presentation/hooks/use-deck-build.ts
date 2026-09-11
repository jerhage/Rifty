import { useCallback } from "react";

import type { ZoneSection } from "@/features/deck/deck/deck-legality";

import type { DeckBuildCapabilities, DeckBuildStart } from "../deck-build-start";

import { useDeckBuildSteps } from "./use-deck-build-steps";
import { useDeckDraft } from "./use-deck-draft";
import { useDeckSave } from "./use-deck-save";
import { useLegendSearch } from "./use-legend-search";
import { useZonePool } from "./use-zone-pool";

function useDeckBuild(
  start: DeckBuildStart,
  capabilities: DeckBuildCapabilities,
  { onExit, onSaved }: { readonly onExit: () => void; readonly onSaved: () => void },
) {
  const draft = useDeckDraft(start);
  const legend = draft.draft.legend;
  const pool = useZonePool(legend);
  const legends = useLegendSearch();
  const saving = useDeckSave(start, capabilities, { onSaved });

  const { changeName, entries } = draft;
  const { resetFor, setZone } = pool;
  const { clearFailure, save: saveRequest } = saving;

  const steps = useDeckBuildSteps(start, {
    /** The zones step opens on the legend's own domains rather than the whole catalog. */
    onEnterStep: (step) => {
      if (step.id === "zones") resetFor(legend);
    },
    onExit,
  });

  const nameDeck = useCallback(
    (name: string) => {
      changeName(name);
      clearFailure();
    },
    [changeName, clearFailure],
  );

  /** Each zone draws from a different pool, so its filters do not carry across. */
  const selectZone = useCallback(
    (section: ZoneSection) => {
      setZone(section);
      resetFor(legend);
    },
    [legend, resetFor, setZone],
  );

  const name = draft.draft.name;
  const chosenChampionCardId = draft.draft.chosenChampion?.cardId ?? null;
  const save = useCallback(
    () => saveRequest({ chosenChampionCardId, entries, name }),
    [chosenChampionCardId, entries, name, saveRequest],
  );

  return {
    draft: { ...draft, changeName: nameDeck },
    legends,
    pool: { ...pool, setZone: selectZone },
    saving: { ...saving, save },
    steps,
  };
}

type DeckBuildState = ReturnType<typeof useDeckBuild>;
type DeckDraftState = DeckBuildState["draft"];
type DeckBuildStepsState = DeckBuildState["steps"];
type DeckSaveState = DeckBuildState["saving"];
type LegendSearchState = DeckBuildState["legends"];
type ZonePoolState = DeckBuildState["pool"];

type LegendSearchViewState = Pick<
  LegendSearchState,
  "domainIds" | "query" | "setQuery" | "toggleDomain"
>;
type ZoneDraftViewState = Pick<
  DeckDraftState,
  "changeName" | "draft" | "setQuantity" | "verification"
>;
type ZonePoolViewState = Pick<
  ZonePoolState,
  | "filters"
  | "layout"
  | "openFilters"
  | "query"
  | "setLayout"
  | "setQuery"
  | "setView"
  | "setZone"
  | "view"
  | "zone"
>;

export { useDeckBuild };
export type {
  DeckBuildState,
  DeckBuildStepsState,
  DeckDraftState,
  DeckSaveState,
  LegendSearchState,
  LegendSearchViewState,
  ZoneDraftViewState,
  ZonePoolState,
  ZonePoolViewState,
};
