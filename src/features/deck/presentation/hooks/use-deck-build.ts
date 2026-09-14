import { useCallback } from "react";

import type { DeckSection } from "@/features/deck/deck/deck";

import type { DeckBuildMode } from "../deck-build-mode";

import { useDeckBuildSteps } from "./use-deck-build-steps";
import { useDeckDraft } from "./use-deck-draft";
import { useLegendSearch } from "./use-legend-search";
import { useSectionPool } from "./use-section-pool";

function useDeckBuild(mode: DeckBuildMode, { onExit }: { readonly onExit: () => void }) {
  const draft = useDeckDraft(mode);
  const legend = draft.draft.legend;
  const pool = useSectionPool(legend);
  const legends = useLegendSearch();

  const { resetFor, setSection } = pool;

  const steps = useDeckBuildSteps(mode, {
    /** The sections step opens on the legend's own domains rather than the whole catalog. */
    onEnterStep: (step) => {
      if (step.id === "sections") resetFor(legend);
    },
    onExit,
  });

  /** Each section draws from a different pool, so its filters do not carry across. */
  const selectSection = useCallback(
    (section: DeckSection) => {
      setSection(section);
      resetFor(legend);
    },
    [legend, resetFor, setSection],
  );

  return {
    draft,
    legends,
    pool: { ...pool, setSection: selectSection },
    steps,
  };
}

type DeckBuildState = ReturnType<typeof useDeckBuild>;
type DeckDraftState = DeckBuildState["draft"];
type DeckBuildStepsState = DeckBuildState["steps"];
type LegendSearchState = DeckBuildState["legends"];
type SectionPoolState = DeckBuildState["pool"];

type LegendSearchViewState = Pick<
  LegendSearchState,
  "domainIds" | "query" | "setQuery" | "toggleDomain"
>;
type SectionDraftViewState = Pick<DeckDraftState, "draft" | "setQuantity" | "verification">;
type SectionPoolViewState = Pick<
  SectionPoolState,
  | "filters"
  | "openFilters"
  | "openSort"
  | "poolLayout"
  | "query"
  | "setPoolLayout"
  | "setQuery"
  | "setView"
  | "setSection"
  | "sort"
  | "toggleSortDirection"
  | "view"
  | "section"
>;

export { useDeckBuild };
export type {
  DeckBuildState,
  DeckBuildStepsState,
  DeckDraftState,
  LegendSearchState,
  LegendSearchViewState,
  SectionDraftViewState,
  SectionPoolState,
  SectionPoolViewState,
};
