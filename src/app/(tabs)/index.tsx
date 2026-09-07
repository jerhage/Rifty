import { useCallback, useMemo, useState } from "react";
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
import { CardCatalogScreen } from "@/features/catalog/presentation/screens/card-catalog-screen";

function HomeScreen() {
  const { catalog } = useAppDependencies();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [criteria, setCriteria] = useState<CatalogQueryCriteria>({});
  const [draftCriteria, setDraftCriteria] = useState<CatalogQueryCriteria>({});
  const [isFilterSheetPresented, setIsFilterSheetPresented] = useState(false);
  const cardSummaryLister = useMemo<CardSummaryLister>(
    () => ({
      getSummaryPage: (pagination, options) =>
        catalog.cards.getSummaryPage({ ...criteria, ...pagination }, options),
    }),
    [catalog.cards, criteria],
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
          <CardCatalogScreen
            {...content}
            filterButtonTop={insets.top + Spacing.three}
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

export default HomeScreen;
