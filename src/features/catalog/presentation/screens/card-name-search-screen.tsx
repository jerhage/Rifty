import { StyleSheet } from "react-native";

import { ThemedView } from "@/components/ui/atoms/themed-view";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardSummariesDataContent } from "@/features/card/presentation/data/card-summaries-data";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { PrintingId } from "@/features/card/value-objects/printing-id";

import type { CatalogQueryCriteria } from "../catalog-query-criteria";
import { CardSummaryGrid } from "../components/grid/card-summary-grid";
import { CardSummaryPageFooter } from "../components/grid/card-summary-page-footer";
import { CatalogResultBar } from "../components/search/catalog-result-bar";
import { CatalogSearchHeader } from "../components/search/catalog-search-header";

interface CardNameSearchScreenProps extends CardSummariesDataContent {
  readonly criteria: CatalogQueryCriteria;
  readonly name: string;
  readonly onChangeName: (name: string) => void;
  readonly onClearDomains: () => void;
  readonly onClearTypes: () => void;
  readonly onOpenFilters: () => void;
  readonly onOpenSort: () => void;
  readonly onSelectCard: (id: PrintingId) => void;
  readonly onToggleDomain: (domainId: CardDomain) => void;
  readonly onToggleSortDirection: () => void;
  readonly onToggleType: (typeId: CardType) => void;
}

function CardNameSearchScreen({
  cards,
  criteria,
  isLoadingMore,
  isRefreshing,
  loadMore,
  loadMoreError,
  name,
  onChangeName,
  onClearDomains,
  onClearTypes,
  onOpenFilters,
  onOpenSort,
  onSelectCard,
  onToggleDomain,
  onToggleSortDirection,
  onToggleType,
  refresh,
  retryLoadMore,
  total,
}: CardNameSearchScreenProps) {
  return (
    <ThemedView style={styles.screen}>
      <CatalogSearchHeader
        criteria={criteria}
        name={name}
        onChangeName={onChangeName}
        onClearDomains={onClearDomains}
        onClearTypes={onClearTypes}
        onToggleDomain={onToggleDomain}
        onToggleType={onToggleType}
      />
      <CardSummaryGrid
        cards={cards}
        emptyMessage={
          name.trim() ? "No cards match that search." : "No cards match. Loosen a filter?"
        }
        footer={
          <CardSummaryPageFooter
            isLoadingMore={isLoadingMore}
            loadMoreError={loadMoreError}
            retryLoadMore={retryLoadMore}
          />
        }
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
        onRefresh={refresh}
        onSelectCard={onSelectCard}
      />
    </ThemedView>
  );
}

export { CardNameSearchScreen };
export type { CardNameSearchScreenProps };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
