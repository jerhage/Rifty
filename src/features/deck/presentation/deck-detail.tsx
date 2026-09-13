import type { Card } from "@/features/card/card";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";
import { resolvedComposition, type ResolvedDeck } from "@/features/deck/deck/resolved-deck";

import { DeckDetailScreen } from "./screens/deck-detail-screen";

function DeckDetail({
  now,
  onDrawSimulation,
  onEdit,
  onOpenCard,
  resolvedDeck,
}: {
  readonly now: string;
  readonly onDrawSimulation: () => void;
  readonly onEdit: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly resolvedDeck: ResolvedDeck;
}) {
  return (
    <DeckDetailScreen
      now={now}
      onDrawSimulation={onDrawSimulation}
      onEdit={onEdit}
      onOpenCard={onOpenCard}
      resolvedDeck={resolvedDeck}
      verification={verifyDeck(resolvedComposition(resolvedDeck), RIFTBOUND_STANDARD)}
    />
  );
}

export { DeckDetail };
