import { StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { RandomSource } from "@/application/ports/random-source";
import type { Card } from "@/features/card/card";
import type { CardByCardIdFinder } from "@/features/card/card-by-card-id-finder";
import type { CardsByPrintingIdsFinder } from "@/features/card/cards-by-printing-ids-finder";
import type { DeckId } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";

import { DeckDetailPane } from "./deck-detail-pane";
import { DrawSimulationPane } from "./draw-simulation-pane";
import type { DeckPaneContent } from "./hooks/use-deck-opening";

function DeckPrimaryPane({
  cardByCardIdFinder,
  cardsByPrintingIdsFinder,
  deckFinder,
  now,
  onClose,
  onEdit,
  onOpenCard,
  onOpenDrawSimulation,
  onReturnToDetail,
  randomSource,
  shown,
}: {
  readonly cardByCardIdFinder: CardByCardIdFinder;
  readonly cardsByPrintingIdsFinder: CardsByPrintingIdsFinder;
  readonly deckFinder: DeckFinder;
  readonly now: string;
  readonly onClose: () => void;
  readonly onEdit: (deckId: DeckId) => void;
  readonly onOpenCard: (card: Card) => void;
  readonly onOpenDrawSimulation: (deckId: DeckId) => void;
  readonly onReturnToDetail: () => void;
  readonly randomSource: RandomSource;
  readonly shown: DeckPaneContent;
}) {
  return match(shown)
    .with({ type: "noDeck" }, () => <NoDeckPane />)
    .with({ type: "detail" }, ({ deckId }) => (
      <DeckDetailPane
        cardByCardIdFinder={cardByCardIdFinder}
        cardsByPrintingIdsFinder={cardsByPrintingIdsFinder}
        deckFinder={deckFinder}
        deckId={deckId}
        now={now}
        onClose={onClose}
        onDrawSimulation={onOpenDrawSimulation}
        onEdit={onEdit}
        onOpenCard={onOpenCard}
      />
    ))
    .with({ type: "drawSimulation" }, ({ deckId }) => (
      <DrawSimulationPane
        cardByCardIdFinder={cardByCardIdFinder}
        cardsByPrintingIdsFinder={cardsByPrintingIdsFinder}
        deckFinder={deckFinder}
        deckId={deckId}
        onOpenCard={onOpenCard}
        onReturnToDetail={onReturnToDetail}
        randomSource={randomSource}
      />
    ))
    .exhaustive();
}

function NoDeckPane() {
  return (
    <ThemedView style={styles.idle}>
      <ThemedText accessibilityRole="header" type="heading">
        No deck open
      </ThemedText>
      <ThemedText themeColor="textSecondary" type="body" style={styles.idleNote}>
        Pick a deck from the list and it opens here, without leaving your decks.
      </ThemedText>
    </ThemedView>
  );
}

export { DeckPrimaryPane };

const styles = StyleSheet.create({
  idle: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.four,
  },
  idleNote: {
    marginTop: Spacing.two,
  },
});
