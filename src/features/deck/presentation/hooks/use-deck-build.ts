import { useCallback } from "react";

import type { ZoneSection } from "@/features/deck/deck/deck-legality";

import type { DeckBuildStart } from "../deck-build-start";

import { useDeckBuildSteps } from "./use-deck-build-steps";
import { useDeckDraft } from "./use-deck-draft";
import { useLegendSearch } from "./use-legend-search";
import { useZonePool } from "./use-zone-pool";

function useDeckBuild(start: DeckBuildStart, { onExit }: { readonly onExit: () => void }) {
  const draft = useDeckDraft(start);
  const legend = draft.draft.legend;
  const pool = useZonePool(legend);
  const legends = useLegendSearch();

  const { resetFor, setZone } = pool;

  const steps = useDeckBuildSteps(start, {
    /** The zones step opens on the legend's own domains rather than the whole catalog. */
    onEnterStep: (step) => {
      if (step.id === "zones") resetFor(legend);
    },
    onExit,
  });

  /** Each zone draws from a different pool, so its filters do not carry across. */
  const selectZone = useCallback(
    (section: ZoneSection) => {
      setZone(section);
      resetFor(legend);
    },
    [legend, resetFor, setZone],
  );

  return {
    draft,
    legends,
    pool: { ...pool, setZone: selectZone },
    steps,
  };
}

type DeckBuildState = ReturnType<typeof useDeckBuild>;
type DeckDraftState = DeckBuildState["draft"];
type DeckBuildStepsState = DeckBuildState["steps"];
type LegendSearchState = DeckBuildState["legends"];
type ZonePoolState = DeckBuildState["pool"];

type LegendSearchViewState = Pick<
  LegendSearchState,
  "domainIds" | "query" | "setQuery" | "toggleDomain"
>;
type ZoneDraftViewState = Pick<DeckDraftState, "draft" | "setQuantity" | "verification">;
type ZonePoolViewState = Pick<
  ZonePoolState,
  | "filters"
  | "layout"
  | "openFilters"
  | "openSort"
  | "query"
  | "setLayout"
  | "setQuery"
  | "setView"
  | "setZone"
  | "sort"
  | "toggleSortDirection"
  | "view"
  | "zone"
>;

export { useDeckBuild };
export type {
  DeckBuildState,
  DeckBuildStepsState,
  DeckDraftState,
  LegendSearchState,
  LegendSearchViewState,
  ZoneDraftViewState,
  ZonePoolState,
  ZonePoolViewState,
};
