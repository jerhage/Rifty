import type { Card } from "@/features/card/card";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";
import type { Keyword } from "@/features/card/keyword/keyword";

import { ZonePoolData } from "../../../data/zone-pool-data";
import type {
  DeckBuildStepsState,
  DeckDraftState,
  DeckSaveState,
  ZonePoolState,
} from "../../../hooks/use-deck-build";
import { PoolFilterSheet } from "../pool-filter-sheet";
import { ZonesStep } from "../steps/zones-step";

interface ZonesPaneProps {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly draft: DeckDraftState;
  readonly keywords: readonly Keyword[];
  readonly onOpenCard: (card: Card) => void;
  readonly pool: ZonePoolState;
  readonly saving: DeckSaveState;
  readonly steps: DeckBuildStepsState;
}

function ZonesPane({
  cardCounter,
  cardLister,
  draft,
  keywords,
  onOpenCard,
  pool,
  saving,
  steps,
}: ZonesPaneProps) {
  return (
    <ZonePoolData
      cardCounter={cardCounter}
      cardLister={cardLister}
      filters={pool.filters}
      query={pool.searchQuery}
      zone={pool.zone}
    >
      {(zonePool) => (
        <>
          <ZonesStep
            draft={draft}
            onEditStep={steps.goToStep}
            onLoadMorePool={zonePool.loadMore}
            onOpenCard={onOpenCard}
            onSave={() => void saving.save()}
            pool={pool}
            saveStatus={saving.status}
            zonePool={zonePool.cards}
          />
          <PoolFilterSheet
            filters={pool.draftFilters}
            isPresented={pool.isFilterOpen}
            keywords={keywords}
            onApply={pool.applyFilters}
            onDismiss={pool.dismissFilters}
            onReset={pool.resetFilters}
            onToggleDomain={pool.toggleDomain}
            onToggleKeyword={pool.toggleKeyword}
            onToggleType={pool.toggleType}
            zone={pool.zone}
          />
        </>
      )}
    </ZonePoolData>
  );
}

export { ZonesPane };
export type { ZonesPaneProps };
