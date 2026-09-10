import { useCallback, useMemo, useState } from "react";

import type { CardCounter } from "@/features/catalog/card/card-counter";
import type { CardSummaryLister } from "@/features/catalog/card/card-summary-lister";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardType } from "@/features/card/value-objects/card-type";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import type { CatalogQueryCriteria } from "../catalog-query-criteria";
import { sortForId, toggledSort } from "../catalog-sort-options";

const SEARCH_DEBOUNCE_MS = 300;

/** The catalog opens alphabetically; browsing a card list by name is the common case. */
const DEFAULT_CRITERIA: CatalogQueryCriteria = { sort: sortForId("name") };

type CardSummaryBrowser = CardSummaryLister & CardCounter;

/** Which face of the catalog bottom sheet is showing, if any. */
type CatalogSheetState =
  | { readonly type: "hidden" }
  | { readonly type: "filter" }
  | { readonly type: "sort" };

function useCatalogQuery(cards: CardSummaryBrowser) {
  const [criteria, setCriteria] = useState<CatalogQueryCriteria>(DEFAULT_CRITERIA);
  const [draftCriteria, setDraftCriteria] = useState<CatalogQueryCriteria>(DEFAULT_CRITERIA);
  const [sheet, setSheet] = useState<CatalogSheetState>({ type: "hidden" });
  const [name, setName] = useState("");
  const debouncedName = useDebouncedValue(name, SEARCH_DEBOUNCE_MS);
  const lister = useMemo<CardSummaryLister>(
    () => ({
      getSummaryPage: (pagination, options) =>
        cards.getSummaryPage(
          {
            ...criteria,
            ...pagination,
            search: searchCriteriaFor(debouncedName),
          },
          options,
        ),
    }),
    [cards, criteria, debouncedName],
  );
  const counter = useMemo<CardCounter>(
    () => ({
      count: (_criteria, options) =>
        cards.count({ ...criteria, search: searchCriteriaFor(debouncedName) }, options),
    }),
    [cards, criteria, debouncedName],
  );

  const openFilters = useCallback(() => {
    setDraftCriteria(criteria);
    setSheet({ type: "filter" });
  }, [criteria]);
  const openSort = useCallback(() => {
    setDraftCriteria(criteria);
    setSheet({ type: "sort" });
  }, [criteria]);
  const dismissSheet = useCallback(() => {
    setDraftCriteria(criteria);
    setSheet({ type: "hidden" });
  }, [criteria]);
  const applyFilters = useCallback(() => {
    setCriteria(draftCriteria);
    setSheet({ type: "hidden" });
  }, [draftCriteria]);
  /**
   * Reset belongs to the advanced-filter face, so it clears only the facets that face owns. The
   * ordering and the domain and type chips above the grid are left alone.
   */
  const clearFilters = useCallback(
    () =>
      setDraftCriteria((current) => ({
        anyDomainIds: current.anyDomainIds,
        sort: current.sort,
        typeIds: current.typeIds,
      })),
    [],
  );

  /**
   * The domain and type chips above the grid apply straight away rather than through the sheet's
   * draft, so the grid reacts to a tap without a second confirming gesture.
   */
  const toggleDomain = useCallback((domainId: CardDomain) => {
    setCriteria((current) => ({
      ...current,
      anyDomainIds: toggleId(current.anyDomainIds, domainId),
    }));
  }, []);
  const toggleType = useCallback((typeId: CardType) => {
    setCriteria((current) => ({ ...current, typeIds: toggleId(current.typeIds, typeId) }));
  }, []);
  const clearDomains = useCallback(() => {
    setCriteria((current) => ({ ...current, anyDomainIds: undefined }));
  }, []);
  const clearTypes = useCallback(() => {
    setCriteria((current) => ({ ...current, typeIds: undefined }));
  }, []);

  /** The arrow beside the sort label flips direction in place, without opening the sheet. */
  const toggleSortDirection = useCallback(() => {
    setCriteria((current) => ({ ...current, sort: toggledSort(current.sort) }));
  }, []);

  return {
    applyFilters,
    cardCounter: counter,
    cardSummaryLister: lister,
    clearDomains,
    clearFilters,
    clearTypes,
    criteria,
    dismissSheet,
    draftCriteria,
    name,
    openFilters,
    openSort,
    setDraftCriteria,
    setName,
    sheet,
    toggleDomain,
    toggleSortDirection,
    toggleType,
  };
}

function toggleId<Id extends string>(
  selectedIds: readonly Id[] | undefined,
  id: Id,
): Id[] | undefined {
  const currentIds = selectedIds ?? [];
  const nextIds = currentIds.includes(id)
    ? currentIds.filter((selectedId) => selectedId !== id)
    : [...currentIds, id];

  return nextIds.length === 0 ? undefined : nextIds;
}

function searchCriteriaFor(name: string) {
  const text = name.trim();
  return text ? { type: "nameOrRulesText" as const, text } : undefined;
}

export { useCatalogQuery };
export type { CardSummaryBrowser };
export type { CatalogSheetState };
