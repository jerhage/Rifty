import type { Card } from "@/features/card/card";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";

import { LegendPoolData } from "../../../data/legend-pool-data";
import type {
  DeckBuildStepsState,
  DeckDraftState,
  LegendSearchState,
} from "../../../hooks/use-deck-build";
import { LegendStep } from "../steps/legend-step";

interface LegendPaneProps {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly draft: DeckDraftState;
  readonly legends: LegendSearchState;
  readonly onOpenCard: (card: Card) => void;
  readonly steps: DeckBuildStepsState;
}

function LegendPane({
  cardCounter,
  cardLister,
  draft,
  legends,
  onOpenCard,
  steps,
}: LegendPaneProps) {
  return (
    <LegendPoolData
      cardCounter={cardCounter}
      cardLister={cardLister}
      domainIds={legends.domainIds}
      query={legends.searchQuery}
    >
      {(legendPool) => (
        <LegendStep
          legends={legendPool.cards}
          onChangeQuery={legends.setQuery}
          onLoadMore={legendPool.loadMore}
          onNext={steps.next}
          onOpenCard={onOpenCard}
          onPick={draft.pickLegend}
          onToggleDomain={legends.toggleDomain}
          query={legends.query}
          selected={draft.draft.legend}
          selectedDomainIds={legends.domainIds}
          step={steps.step}
        />
      )}
    </LegendPoolData>
  );
}

export { LegendPane };
export type { LegendPaneProps };
