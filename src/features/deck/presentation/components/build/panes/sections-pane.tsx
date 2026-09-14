import type { Card } from "@/features/card/card";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";
import type { Keyword } from "@/features/card/keyword/keyword";

import { DeckSaveData } from "../../../data/deck-save-data";
import { SectionPoolData } from "../../../data/section-pool-data";
import type { DeckBuildCapabilities, DeckBuildStart } from "../../../deck-build-start";
import type {
  DeckBuildStepsState,
  DeckDraftState,
  SectionPoolState,
} from "../../../hooks/use-deck-build";
import { PoolSheet } from "../pool-sheet";
import { SectionsStep } from "../steps/sections-step";

interface SectionsPaneProps {
  readonly capabilities: DeckBuildCapabilities;
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly draft: DeckDraftState;
  readonly keywords: readonly Keyword[];
  readonly onOpenCard: (card: Card) => void;
  readonly onSaved: () => void;
  readonly pool: SectionPoolState;
  readonly start: DeckBuildStart;
  readonly steps: DeckBuildStepsState;
}

function SectionsPane({
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
}: SectionsPaneProps) {
  return (
    <SectionPoolData
      cardCounter={cardCounter}
      cardLister={cardLister}
      filters={pool.filters}
      query={pool.searchQuery}
      sort={pool.sort}
      section={pool.section}
    >
      {(sectionPool) => (
        <>
          <DeckSaveData
            capabilities={capabilities}
            onChangeName={draft.changeName}
            onSaved={onSaved}
            request={{
              chosenChampion: draft.chosenChampion,
              entries: draft.entries,
              name: draft.draft.name,
              verification: draft.verification,
            }}
            start={start}
          >
            {({ changeName }) => (
              <SectionsStep
                draft={draft}
                onChangeName={changeName}
                onEditStep={steps.goToStep}
                onLoadMorePool={sectionPool.loadMore}
                onOpenCard={onOpenCard}
                pool={pool}
                sectionPool={sectionPool.cards}
              />
            )}
          </DeckSaveData>
          <PoolSheet
            filters={pool.draftFilters}
            keywords={keywords}
            onApplyFilters={pool.applyFilters}
            onApplySort={pool.applySort}
            onChangeSort={pool.changeSort}
            onDismiss={pool.dismissSheet}
            onReset={pool.resetFilters}
            onToggleDomain={pool.toggleDomain}
            onToggleKeyword={pool.toggleKeyword}
            onToggleType={pool.toggleType}
            sheet={pool.sheet}
            sort={pool.draftSort}
            section={pool.section}
          />
        </>
      )}
    </SectionPoolData>
  );
}

export { SectionsPane };
export type { SectionsPaneProps };
