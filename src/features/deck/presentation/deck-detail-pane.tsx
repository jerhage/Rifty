import { StyleSheet, View } from "react-native";

import { TextAction } from "@/components/ui/atoms/text-action";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import type { CardByCardIdFinder } from "@/features/card/card-by-card-id-finder";
import type { CardsByPrintingIdsFinder } from "@/features/card/cards-by-printing-ids-finder";
import type { DeckId } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";

import { DeckDetail } from "./deck-detail";
import { DeckDetailData } from "./data/deck-detail-data";

function DeckDetailPane({
  cardByCardIdFinder,
  cardsByPrintingIdsFinder,
  deckFinder,
  deckId,
  now,
  onClose,
  onDrawSimulation,
  onEdit,
  onOpenCard,
}: {
  readonly cardByCardIdFinder: CardByCardIdFinder;
  readonly cardsByPrintingIdsFinder: CardsByPrintingIdsFinder;
  readonly deckFinder: DeckFinder;
  readonly deckId: DeckId | null;
  readonly now: string;
  readonly onClose: () => void;
  readonly onDrawSimulation: (deckId: DeckId) => void;
  readonly onEdit: (deckId: DeckId) => void;
  readonly onOpenCard: (card: Card) => void;
}) {
  if (deckId === null) return <IdleDeckPane />;

  return (
    <View style={styles.pane}>
      <View style={styles.closeRow}>
        <TextAction accessibilityLabel="Close the deck" label="✕" onPress={onClose} />
      </View>
      <DeckDetailData
        cardByCardIdFinder={cardByCardIdFinder}
        cardsByPrintingIdsFinder={cardsByPrintingIdsFinder}
        deckFinder={deckFinder}
        deckId={deckId}
      >
        {({ resolvedDeck }) => (
          <DeckDetail
            now={now}
            onDrawSimulation={() => onDrawSimulation(deckId)}
            onEdit={() => onEdit(deckId)}
            onOpenCard={onOpenCard}
            resolvedDeck={resolvedDeck}
          />
        )}
      </DeckDetailData>
    </View>
  );
}

function IdleDeckPane() {
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

export { DeckDetailPane };

const styles = StyleSheet.create({
  pane: {
    flex: 1,
  },
  closeRow: {
    alignItems: "flex-end",
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
  },
  idle: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.four,
  },
  idleNote: {
    marginTop: Spacing.two,
  },
});
