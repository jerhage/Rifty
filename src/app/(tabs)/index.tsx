import { useRouter } from "expo-router";

import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { CardSummariesData } from "@/features/card/presentation/data/card-summaries-data";
import { KeywordsData } from "@/features/card/presentation/data/keywords-data";
import { CardCatalogFilterSheet } from "@/features/catalog/presentation/components/sheet/card-catalog-filter-sheet";
import { useCatalogQuery } from "@/features/catalog/presentation/hooks/use-catalog-query";
import { CardNameSearchScreen } from "@/features/catalog/presentation/screens/card-name-search-screen";
import { CardSetsData } from "@/features/set/presentation/data/card-sets-data";

function HomeScreen() {
  const { cards, sets } = useAppDependencies();
  const router = useRouter();
  const catalogQuery = useCatalogQuery(cards.cardRepository);

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
      <CardSetsData setLister={sets.setRepository}>
        {(cardSets) => (
          <KeywordsData keywordLister={cards.keywordLister}>
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
