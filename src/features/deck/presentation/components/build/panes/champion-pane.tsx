import type { Card } from "@/features/card/card";
import type { CardCounter } from "@/features/card/card-counter";
import type { CardLister } from "@/features/card/card-lister";

import { ChampionPoolData } from "../../../data/champion-pool-data";
import type { DeckBuildStepsState, DeckDraftState } from "../../../hooks/use-deck-build";
import { ChampionStep } from "../steps/champion-step";

interface ChampionPaneProps {
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly draft: DeckDraftState;
  readonly onOpenCard: (card: Card) => void;
  readonly steps: DeckBuildStepsState;
}

function ChampionPane({ cardCounter, cardLister, draft, onOpenCard, steps }: ChampionPaneProps) {
  return (
    <ChampionPoolData cardCounter={cardCounter} cardLister={cardLister} legend={draft.draft.legend}>
      {(championPool) => (
        <ChampionStep
          champions={championPool.cards}
          legend={draft.draft.legend}
          onLoadMore={championPool.loadMore}
          onNext={steps.next}
          onOpenCard={onOpenCard}
          onPick={draft.pickChampion}
          selected={draft.draft.chosenChampion}
          step={steps.step}
        />
      )}
    </ChampionPoolData>
  );
}

export { ChampionPane };
export type { ChampionPaneProps };
