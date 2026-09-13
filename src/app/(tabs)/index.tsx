import { useRouter } from "expo-router";
import { useCallback } from "react";
import { match } from "ts-pattern";

import { SplitLayout } from "@/components/app-shell/split-layout";
import { useAppDependencies } from "@/composition/app-dependencies-provider";
import type { CardSummary } from "@/features/card/card-summary";
import { CardDetailPane } from "@/features/card/presentation/card-detail-pane";
import { CardSummariesData } from "@/features/card/presentation/data/card-summaries-data";
import { KeywordsData } from "@/features/card/presentation/data/keywords-data";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import { CardCatalogFilterSheet } from "@/features/catalog/presentation/components/sheet/card-catalog-filter-sheet";
import { useCardOpening } from "@/features/catalog/presentation/hooks/use-card-opening";
import { useCatalogQuery } from "@/features/catalog/presentation/hooks/use-catalog-query";
import { CardNameSearchScreen } from "@/features/catalog/presentation/screens/card-name-search-screen";
import { CardSetsData } from "@/features/set/presentation/data/card-sets-data";

type CatalogQuery = ReturnType<typeof useCatalogQuery>;

function HomeScreen() {
  const { cards, sets } = useAppDependencies();
  const router = useRouter();
  const catalogQuery = useCatalogQuery();
  const pushCardRoute = useCallback(
    (cardId: PrintingId) => router.push({ pathname: "/cards/[id]", params: { id: cardId } }),
    [router],
  );
  const opening = useCardOpening(pushCardRoute);

  return (
    <>
      {match(opening)
        .with({ type: "route" }, ({ openCard }) => (
          <CardCatalog catalogQuery={catalogQuery} onOpenCard={openCard} />
        ))
        .with({ type: "pane" }, ({ closeCard, openCard, shownCardId }) => (
          <SplitLayout
            primary={<CardCatalog catalogQuery={catalogQuery} onOpenCard={openCard} />}
            secondary={
              <CardDetailPane
                cardFinder={cards.cardRepository}
                cardId={shownCardId}
                onClose={closeCard}
              />
            }
          />
        ))
        .exhaustive()}
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

function CardCatalog({
  catalogQuery,
  onOpenCard,
}: {
  readonly catalogQuery: CatalogQuery;
  readonly onOpenCard: (card: CardSummary) => void;
}) {
  const { cards } = useAppDependencies();

  return (
    <CardSummariesData
      cardCounter={cards.cardRepository}
      cardSummaryLister={cards.cardRepository}
      criteria={catalogQuery.queryCriteria}
    >
      {(content) => (
        <CardNameSearchScreen
          {...content}
          criteria={catalogQuery.criteria}
          name={catalogQuery.name}
          onChangeName={catalogQuery.setName}
          onClearDomains={catalogQuery.clearDomains}
          onClearTypes={catalogQuery.clearTypes}
          onOpenCard={onOpenCard}
          onOpenFilters={catalogQuery.openFilters}
          onOpenSort={catalogQuery.openSort}
          onToggleDomain={catalogQuery.toggleDomain}
          onToggleSortDirection={catalogQuery.toggleSortDirection}
          onToggleType={catalogQuery.toggleType}
        />
      )}
    </CardSummariesData>
  );
}

export default HomeScreen;
