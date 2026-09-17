import { useCallback, useState } from "react";

import type { CardSort } from "@/features/card/card-list-criteria";
import { toggledSort } from "@/features/card/presentation/card-sort-options";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { DeckSection } from "@/features/deck/deck/deck";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDraftSheet } from "@/hooks/use-draft-sheet";
import { toggle } from "@/shared/toggle";

import type { DeckBuildPick } from "../deck-build-steps";
import {
  DEFAULT_POOL_SORT,
  defaultPoolFilters,
  type SectionPoolFilters,
  type SectionPoolLayout,
  type SectionPoolView,
} from "../deck-section-pool";

const SEARCH_DEBOUNCE_MS = 300;

/** Which face of the pool's bottom sheet is showing, if any. */
type SectionPoolSheetState =
  | { readonly type: "hidden" }
  | { readonly type: "filter" }
  | { readonly type: "sort" };

function useSectionPool(legend: DeckBuildPick) {
  const [section, setSection] = useState<DeckSection>("mainDeck");
  const [query, setQuery] = useState("");
  const [poolLayout, setPoolLayout] = useState<SectionPoolLayout>("list");
  const [view, setView] = useState<SectionPoolView>("pool");
  const filterSheet = useDraftSheet<SectionPoolFilters>(() => defaultPoolFilters(legend));
  const sortSheet = useDraftSheet<CardSort | undefined>(() => DEFAULT_POOL_SORT);
  const { dismiss: dismissFilters, editDraft, settle } = filterSheet;
  const { dismiss: dismissSort, editDraft: editSortDraft, settle: settleSort } = sortSheet;
  const appliedSort = sortSheet.applied;

  /** The field updates on every keystroke; `searchQuery` waits for a pause in typing. */
  const searchQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  const toggleDomain = useCallback(
    (domainId: CardDomain) => {
      editDraft((current) => ({ ...current, domainIds: toggle(current.domainIds, domainId) }));
    },
    [editDraft],
  );

  const toggleKeyword = useCallback(
    (keywordId: string) => {
      editDraft((current) => ({ ...current, keywordIds: toggle(current.keywordIds, keywordId) }));
    },
    [editDraft],
  );

  const toggleType = useCallback(
    (typeId: CardType) => {
      editDraft((current) => ({ ...current, typeIds: toggle(current.typeIds, typeId) }));
    },
    [editDraft],
  );

  const resetFilters = useCallback(() => {
    editDraft(() => defaultPoolFilters(legend));
  }, [editDraft, legend]);

  /** Whichever face the shell was showing is the one a swipe away puts back as it was. */
  const dismissSheet = useCallback(() => {
    dismissFilters();
    dismissSort();
  }, [dismissFilters, dismissSort]);

  const changeSort = useCallback(
    (sort: CardSort | undefined) => {
      editSortDraft(() => sort);
    },
    [editSortDraft],
  );

  /** The arrow beside the sort label flips direction in place, without opening the sheet. */
  const toggleSortDirection = useCallback(() => {
    settleSort(toggledSort(appliedSort));
  }, [appliedSort, settleSort]);

  /** Each section draws from its own pool, so the filters and the search go; the ordering stays. */
  const resetFor = useCallback(
    (subject: DeckBuildPick) => {
      settle(defaultPoolFilters(subject));
      setQuery("");
    },
    [settle],
  );

  return {
    applyFilters: filterSheet.apply,
    applySort: sortSheet.apply,
    changeSort,
    dismissSheet,
    draftFilters: filterSheet.draft,
    draftSort: sortSheet.draft,
    filters: filterSheet.applied,
    openFilters: filterSheet.open,
    openSort: sortSheet.open,
    poolLayout,
    query,
    resetFilters,
    resetFor,
    searchQuery,
    setPoolLayout,
    setQuery,
    setView,
    setSection,
    sheet: poolSheetState(filterSheet.isOpen, sortSheet.isOpen),
    sort: appliedSort,
    toggleDomain,
    toggleKeyword,
    toggleSortDirection,
    toggleType,
    view,
    section,
  };
}

function poolSheetState(isFilterOpen: boolean, isSortOpen: boolean): SectionPoolSheetState {
  if (isFilterOpen) return { type: "filter" };
  if (isSortOpen) return { type: "sort" };

  return { type: "hidden" };
}

export { useSectionPool };
export type { SectionPoolSheetState };
