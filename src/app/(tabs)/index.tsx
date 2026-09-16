import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { match } from "ts-pattern";

import { SplitLayout } from "@/components/app-shell/split-layout";
import { useAppDependencies } from "@/composition/app-dependencies-provider";
import { BookmarkToggle } from "@/features/annotation/presentation/components/bookmark-toggle";
import { BookmarkedSubjectsData } from "@/features/annotation/presentation/data/bookmarked-subjects-data";
import type { CardSummary } from "@/features/card/card-summary";
import { CardDetailPane } from "@/features/card/presentation/card-detail-pane";
import { CardSummariesData } from "@/features/card/presentation/data/card-summaries-data";
import { KeywordsData } from "@/features/card/presentation/data/keywords-data";
import { cardKeys } from "@/features/card/queries/card-keys";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import { CardCatalogFilterSheet } from "@/features/catalog/presentation/components/sheet/card-catalog-filter-sheet";
import { useCardOpening } from "@/features/catalog/presentation/hooks/use-card-opening";
import {
  useCatalogQuery,
  type CatalogQuery,
} from "@/features/catalog/presentation/hooks/use-catalog-query";
import { CatalogSearchScreen } from "@/features/catalog/presentation/screens/catalog-search-screen";
import { CardSetsData } from "@/features/set/presentation/data/card-sets-data";

function HomeScreen() {
  const { annotations, cards, clock, sets } = useAppDependencies();
  const router = useRouter();
  const queryClient = useQueryClient();
  const catalogQuery = useCatalogQuery();
  const pushCardRoute = useCallback(
    (printingId: PrintingId) =>
      router.push({ pathname: "/cards/[id]", params: { id: printingId } }),
    [router],
  );
  const opening = useCardOpening(pushCardRoute);

  return (
    <BookmarkedSubjectsData
      bookmarkManager={annotations.bookmarkRepository}
      clock={clock}
      kind="card"
      onBookmarksChanged={() => void queryClient.invalidateQueries({ queryKey: cardKeys.all() })}
    >
      {({ bookmarkedIds, toggleBookmark }) => (
        <>
          {match(opening)
            .with({ type: "route" }, ({ open }) => (
              <CardCatalog
                bookmarkedCount={bookmarkedIds.size}
                catalogQuery={catalogQuery}
                onOpenCard={open}
              />
            ))
            .with({ type: "pane" }, ({ close, open, shownId }) => (
              <SplitLayout
                primary={
                  <CardCatalog
                    bookmarkedCount={bookmarkedIds.size}
                    catalogQuery={catalogQuery}
                    onOpenCard={open}
                  />
                }
                secondary={
                  <CardDetailPane
                    bookmarkControl={
                      shownId === null ? null : (
                        <BookmarkToggle
                          bookmarked={bookmarkedIds.has(shownId)}
                          label="Bookmark"
                          onPress={() => toggleBookmark(shownId)}
                        />
                      )
                    }
                    cardFinder={cards.cardRepository}
                    onClose={close}
                    printingId={shownId}
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
                    bookmarkedCount={bookmarkedIds.size}
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
      )}
    </BookmarkedSubjectsData>
  );
}

function CardCatalog({
  bookmarkedCount,
  catalogQuery,
  onOpenCard,
}: {
  readonly bookmarkedCount: number;
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
        <CatalogSearchScreen
          {...content}
          bookmarkedCount={bookmarkedCount}
          criteria={catalogQuery.criteria}
          onChangeQuery={catalogQuery.setQuery}
          onClearDomains={catalogQuery.clearDomains}
          onClearTypes={catalogQuery.clearTypes}
          onOpenCard={onOpenCard}
          onOpenFilters={catalogQuery.openFilters}
          onOpenSort={catalogQuery.openSort}
          onToggleDomain={catalogQuery.toggleDomain}
          onToggleOnlyBookmarked={catalogQuery.toggleBookmarkedOnly}
          onToggleSortDirection={catalogQuery.toggleSortDirection}
          onToggleType={catalogQuery.toggleType}
          query={catalogQuery.query}
        />
      )}
    </CardSummariesData>
  );
}

export default HomeScreen;
