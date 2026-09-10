import type { CardCounter } from "@/features/card/card-counter";
import type { Card } from "@/features/card/card";
import type { CardLister } from "@/features/card/card-lister";
import type { Keyword } from "@/features/card/keyword/keyword";

import type { DeckBuildCapabilities, DeckBuildStart } from "./deck-build-start";
import { useDeckBuild } from "./hooks/use-deck-build";
import { DeckBuildScreen } from "./screens/deck-build-screen";

function DeckBuilder({
  capabilities,
  cardCounter,
  cardLister,
  keywords,
  onExit,
  onOpenCard,
  onSaved,
  start,
}: {
  readonly capabilities: DeckBuildCapabilities;
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly keywords: readonly Keyword[];
  readonly onExit: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onSaved: () => void;
  readonly start: DeckBuildStart;
}) {
  const build = useDeckBuild(start, capabilities, { onExit, onSaved });

  return (
    <DeckBuildScreen
      cardCounter={cardCounter}
      cardLister={cardLister}
      draft={build.draft}
      keywords={keywords}
      legends={build.legends}
      onOpenCard={onOpenCard}
      pool={build.pool}
      saving={build.saving}
      steps={build.steps}
    />
  );
}

export { DeckBuilder };
