import { useRouter } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { CardCatalogFilterSheet } from "@/features/catalog/presentation/components/sheet/card-catalog-filter-sheet";
import { CardSetsData } from "@/features/catalog/presentation/data/card-sets-data";
import { CardSummariesData } from "@/features/catalog/presentation/data/card-summaries-data";
import { KeywordsData } from "@/features/catalog/presentation/data/keywords-data";
import { useCatalogQuery } from "@/features/catalog/presentation/hooks/use-catalog-query";
import { CardNameSearchScreen } from "@/features/catalog/presentation/screens/card-name-search-screen";

function HomeScreen() {
  const { catalog } = useAppDependencies();
  const router = useRouter();
  const catalogQuery = useCatalogQuery(catalog.cardRepository);

  return (
    <>
      <CardSummariesData
        cardCounter={catalogQuery.cardCounter}
        cardSummaryLister={catalogQuery.cardSummaryLister}
      >
        {(content) => (
          <CardNameSearchScreen
            {...content}
            criteria={catalogQuery.criteria}
            name={catalogQuery.name}
            onChangeName={catalogQuery.setName}
            onClearDomains={catalogQuery.clearDomains}
            onClearTypes={catalogQuery.clearTypes}
            onOpenFilters={catalogQuery.openFilters}
            onOpenSort={catalogQuery.openSort}
            onSelectCard={(id) => router.push({ pathname: "/cards/[id]", params: { id } })}
            onToggleDomain={catalogQuery.toggleDomain}
            onToggleSortDirection={catalogQuery.toggleSortDirection}
            onToggleType={catalogQuery.toggleType}
          />
        )}
      </CardSummariesData>
      <CardSetsData setLister={catalog.setRepository}>
        {(cardSets) => (
          <KeywordsData keywordLister={catalog.keywordLister}>
            {(keywords) => (
              <CardCatalogFilterSheet
                cardSets={cardSets}
                criteria={catalogQuery.draftCriteria}
                keywords={keywords}
                onApply={catalogQuery.applyFilters}
                onChangeCriteria={catalogQuery.setDraftCriteria}
                onClear={catalogQuery.clearFilters}
                onDismiss={catalogQuery.dismissSheet}
                sheet={catalogQuery.sheet}
              />
            )}
          </KeywordsData>
        )}
      </CardSetsData>
    </>
  );
}

export default HomeScreen;
