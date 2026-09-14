import { StyleSheet } from "react-native";

import { ThemedView } from "@/components/ui/atoms/themed-view";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardSummariesDataContent } from "@/features/card/presentation/data/card-summaries-data";
import type { CardSummary } from "@/features/card/card-summary";
import type { CardType } from "@/features/card/value-objects/card-type";

import type { CatalogQueryCriteria } from "../catalog-query-criteria";
import { CardSummaryGrid } from "../components/grid/card-summary-grid";
import { CardSummaryPageFooter } from "../components/grid/card-summary-page-footer";
import { CatalogResultBar } from "../components/search/catalog-result-bar";
import { CatalogSearchHeader } from "../components/search/catalog-search-header";

interface CatalogSearchScreenProps extends CardSummariesDataContent {
  readonly criteria: CatalogQueryCriteria;
  readonly onChangeQuery: (query: string) => void;
  readonly onClearDomains: () => void;
  readonly onClearTypes: () => void;
  readonly onOpenCard: (card: CardSummary) => void;
  readonly onOpenFilters: () => void;
  readonly onOpenSort: () => void;
  readonly onToggleDomain: (domainId: CardDomain) => void;
  readonly onToggleSortDirection: () => void;
  readonly onToggleType: (typeId: CardType) => void;
  readonly query: string;
}

function CatalogSearchScreen({
  cards,
  criteria,
  isRefreshing,
  loadMore,
  onChangeQuery,
  onClearDomains,
  onClearTypes,
  onOpenCard,
  onOpenFilters,
  onOpenSort,
  onToggleDomain,
  onToggleSortDirection,
  onToggleType,
  paging,
  query,
  refresh,
  retryLoadMore,
  total,
}: CatalogSearchScreenProps) {
  return (
    <ThemedView style={styles.screen}>
      <CatalogSearchHeader
        criteria={criteria}
        onChangeQuery={onChangeQuery}
        onClearDomains={onClearDomains}
        onClearTypes={onClearTypes}
        onToggleDomain={onToggleDomain}
        onToggleType={onToggleType}
        query={query}
      />
      <CardSummaryGrid
        cards={cards}
        emptyMessage={
          query.trim() ? "No cards match that search." : "No cards match. Loosen a filter?"
        }
        footer={<CardSummaryPageFooter paging={paging} retryLoadMore={retryLoadMore} />}
        header={
          <CatalogResultBar
            criteria={criteria}
            onOpenFilters={onOpenFilters}
            onOpenSort={onOpenSort}
            onToggleSortDirection={onToggleSortDirection}
            resultCount={cards.length}
            total={total}
          />
        }
        isRefreshing={isRefreshing}
        onEndReached={loadMore}
        onOpenCard={onOpenCard}
        onRefresh={refresh}
      />
    </ThemedView>
  );
}

export { CatalogSearchScreen };
export type { CatalogSearchScreenProps };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
