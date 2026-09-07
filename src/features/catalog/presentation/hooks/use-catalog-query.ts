import { useCallback, useMemo, useState } from "react";

import type { CardSummaryLister } from "@/features/catalog/card/card-summary-lister";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import type { CatalogQueryCriteria } from "../components/card-catalog-filter-sheet";

const SEARCH_DEBOUNCE_MS = 300;

function useCatalogQuery(cardSummaryLister: CardSummaryLister) {
  const [criteria, setCriteria] = useState<CatalogQueryCriteria>({});
  const [draftCriteria, setDraftCriteria] = useState<CatalogQueryCriteria>({});
  const [isFilterSheetPresented, setIsFilterSheetPresented] = useState(false);
  const [name, setName] = useState("");
  const debouncedName = useDebouncedValue(name, SEARCH_DEBOUNCE_MS);
  const lister = useMemo<CardSummaryLister>(
    () => ({
      getSummaryPage: (pagination, options) =>
        cardSummaryLister.getSummaryPage(
          {
            ...criteria,
            ...pagination,
            search: searchCriteriaFor(debouncedName),
          },
          options,
        ),
    }),
    [cardSummaryLister, criteria, debouncedName],
  );
  const openFilters = useCallback(() => {
    setDraftCriteria(criteria);
    setIsFilterSheetPresented(true);
  }, [criteria]);
  const dismissFilters = useCallback(() => {
    setDraftCriteria(criteria);
    setIsFilterSheetPresented(false);
  }, [criteria]);
  const applyFilters = useCallback(() => {
    setCriteria(draftCriteria);
    setIsFilterSheetPresented(false);
  }, [draftCriteria]);
  const clearFilters = useCallback(() => setDraftCriteria({}), []);

  return {
    applyFilters,
    cardSummaryLister: lister,
    clearFilters,
    dismissFilters,
    draftCriteria,
    isFilterSheetPresented,
    name,
    openFilters,
    setDraftCriteria,
    setName,
  };
}

function searchCriteriaFor(name: string) {
  const text = name.trim();
  return text ? { type: "nameOrRulesText" as const, text } : undefined;
}

export { useCatalogQuery };
