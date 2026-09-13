import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/ui/atoms/icon-button";
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
  readonly deckId: DeckId;
  readonly now: string;
  readonly onClose: () => void;
  readonly onDrawSimulation: (deckId: DeckId) => void;
  readonly onEdit: (deckId: DeckId) => void;
  readonly onOpenCard: (card: Card) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.pane}>
      <View style={[styles.closeRow, { paddingTop: insets.top + Spacing.two }]}>
        <IconButton accessibilityLabel="Close the deck" glyph="✕" onPress={onClose} />
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
  },
});
