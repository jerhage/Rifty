import type { CardCounter } from "@/features/card/card-counter";
import type { Card } from "@/features/card/card";
import type { CardLister } from "@/features/card/card-lister";
import type { Keyword } from "@/features/card/keyword/keyword";

import type { DeckBuildCapabilities, DeckBuildMode } from "./deck-build-mode";
import { useDeckBuild } from "./hooks/use-deck-build";
import { DeckBuildScreen } from "./screens/deck-build-screen";

function DeckBuilder({
  capabilities,
  cardCounter,
  cardLister,
  keywords,
  mode,
  onExit,
  onOpenCard,
  onSaved,
}: {
  readonly capabilities: DeckBuildCapabilities;
  readonly cardCounter: CardCounter;
  readonly cardLister: CardLister;
  readonly keywords: readonly Keyword[];
  readonly mode: DeckBuildMode;
  readonly onExit: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onSaved: () => void;
}) {
  const build = useDeckBuild(mode, { onExit });

  return (
    <DeckBuildScreen
      capabilities={capabilities}
      cardCounter={cardCounter}
      cardLister={cardLister}
      draft={build.draft}
      keywords={keywords}
      legends={build.legends}
      mode={mode}
      onOpenCard={onOpenCard}
      onSaved={onSaved}
      pool={build.pool}
      steps={build.steps}
    />
  );
}

export { DeckBuilder };
