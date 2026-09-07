import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { Spacing } from "@/constants/theme";
import { CardCatalogFilterSheet } from "@/features/catalog/presentation/components/card-catalog-filter-sheet";
import { CardSetsData } from "@/features/catalog/presentation/data/card-sets-data";
import { CardsData } from "@/features/catalog/presentation/data/cards-data";
import { useCatalogQuery } from "@/features/catalog/presentation/hooks/use-catalog-query";
import { CardNameSearchScreen } from "@/features/catalog/presentation/screens/card-name-search-screen";

function HomeScreen() {
  const { catalog } = useAppDependencies();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const catalogQuery = useCatalogQuery(catalog.cardRepository);

  return (
    <>
      <CardsData cardSummaryLister={catalogQuery.cardSummaryLister}>
        {(content) => (
          <CardNameSearchScreen
            {...content}
            filterButtonTop={insets.top + Spacing.three}
            name={catalogQuery.name}
            onChangeName={catalogQuery.setName}
            onOpenFilters={catalogQuery.openFilters}
            onSelectCard={(id) => router.push({ pathname: "/cards/[id]", params: { id } })}
          />
        )}
      </CardsData>
      <CardSetsData setLister={catalog.setRepository}>
        {(cardSets) => (
          <CardCatalogFilterSheet
            cardSets={cardSets}
            criteria={catalogQuery.draftCriteria}
            isPresented={catalogQuery.isFilterSheetPresented}
            onApply={catalogQuery.applyFilters}
            onChangeCriteria={catalogQuery.setDraftCriteria}
            onClear={catalogQuery.clearFilters}
            onDismiss={catalogQuery.dismissFilters}
          />
        )}
      </CardSetsData>
    </>
  );
}

export default HomeScreen;
