import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { Spacing } from "@/constants/theme";
import type { CardSummaryLister } from "@/features/catalog/card/card-summary-lister";
import {
  CardCatalogFilterSheet,
  type CatalogQueryCriteria,
} from "@/features/catalog/presentation/components/card-catalog-filter-sheet";
import { CardsData } from "@/features/catalog/presentation/data/cards-data";
import { CardNameSearchScreen } from "@/features/catalog/presentation/screens/card-name-search-screen";

const SEARCH_DEBOUNCE_MS = 300;

function HomeScreen() {
  const { catalog } = useAppDependencies();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [criteria, setCriteria] = useState<CatalogQueryCriteria>({});
  const [draftCriteria, setDraftCriteria] = useState<CatalogQueryCriteria>({});
  const [isFilterSheetPresented, setIsFilterSheetPresented] = useState(false);
  const [name, setName] = useState("");
  const debouncedName = useDebouncedValue(name, SEARCH_DEBOUNCE_MS);
  const cardSummaryLister = useMemo<CardSummaryLister>(
    () => ({
      getSummaryPage: (pagination, options) =>
        catalog.cards.getSummaryPage(
          {
            ...criteria,
            ...pagination,
            search: searchCriteriaFor(debouncedName),
          },
          options,
        ),
    }),
    [catalog.cards, criteria, debouncedName],
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

  return (
    <>
      <CardsData cardSummaryLister={cardSummaryLister}>
        {(content) => (
          <CardNameSearchScreen
            {...content}
            filterButtonTop={insets.top + Spacing.three}
            name={name}
            onChangeName={setName}
            onOpenFilters={openFilters}
            onSelectCard={(id) => router.push({ pathname: "/cards/[id]", params: { id } })}
          />
        )}
      </CardsData>
      <CardCatalogFilterSheet
        criteria={draftCriteria}
        isPresented={isFilterSheetPresented}
        onApply={applyFilters}
        onChangeCriteria={setDraftCriteria}
        onClear={clearFilters}
        onDismiss={dismissFilters}
      />
    </>
  );
}

function searchCriteriaFor(name: string) {
  const text = name.trim();
  return text ? { type: "nameOrRulesText" as const, text } : undefined;
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
}

export default HomeScreen;
