import type { Card } from "@/features/card/card";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";
import type { Keyword } from "@/features/card/keyword/keyword";

import { DeckSaveData } from "../../../data/deck-save-data";
import { ZonePoolData } from "../../../data/zone-pool-data";
import type { DeckBuildCapabilities, DeckBuildStart } from "../../../deck-build-start";
import type {
  DeckBuildStepsState,
  DeckDraftState,
  ZonePoolState,
} from "../../../hooks/use-deck-build";
import { PoolFilterSheet } from "../pool-filter-sheet";
import { ZonesStep } from "../steps/zones-step";

interface ZonesPaneProps {
  readonly capabilities: DeckBuildCapabilities;
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly draft: DeckDraftState;
  readonly keywords: readonly Keyword[];
  readonly onOpenCard: (card: Card) => void;
  readonly onSaved: () => void;
  readonly pool: ZonePoolState;
  readonly start: DeckBuildStart;
  readonly steps: DeckBuildStepsState;
}

function ZonesPane({
  capabilities,
  cardCounter,
  cardLister,
  draft,
  keywords,
  onOpenCard,
  onSaved,
  pool,
  start,
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
          <DeckSaveData
            capabilities={capabilities}
            draft={{
              chosenChampionCardId: draft.draft.chosenChampion?.cardId ?? null,
              entries: draft.entries,
              name: draft.draft.name,
              verification: draft.verification,
            }}
            onChangeName={draft.changeName}
            onSaved={onSaved}
            start={start}
          >
            {({ changeName }) => (
              <ZonesStep
                draft={draft}
                onChangeName={changeName}
                onEditStep={steps.goToStep}
                onLoadMorePool={zonePool.loadMore}
                onOpenCard={onOpenCard}
                pool={pool}
                zonePool={zonePool.cards}
              />
            )}
          </DeckSaveData>
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
