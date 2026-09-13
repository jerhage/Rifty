import { StyleSheet, View } from "react-native";

import { TextAction } from "@/components/ui/atoms/text-action";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CardFinder } from "@/features/card/card-finder";
import { CardDetailData } from "@/features/card/presentation/data/card-detail-data";
import { CardDetailScreen } from "@/features/card/presentation/screens/card-detail-screen";
import type { PrintingId } from "@/features/card/value-objects/printing-id";

function CardDetailPane({
  cardFinder,
  cardId,
  onClose,
}: {
  readonly cardFinder: CardFinder;
  readonly cardId: PrintingId | null;
  readonly onClose: () => void;
}) {
  if (cardId === null) return <IdleCardPane />;

  return (
    <View style={styles.pane}>
      <View style={styles.closeRow}>
        <TextAction accessibilityLabel="Close the card" label="✕" onPress={onClose} />
      </View>
      <CardDetailData cardFinder={cardFinder} cardId={cardId}>
        {(card) => <CardDetailScreen card={card} />}
      </CardDetailData>
    </View>
  );
}

function IdleCardPane() {
  return (
    <View style={styles.idle}>
      <ThemedText accessibilityRole="header" type="heading">
        No card open
      </ThemedText>
      <ThemedText themeColor="textSecondary" type="body" style={styles.idleNote}>
        Pick a card from the grid and it opens here, without leaving the catalog.
      </ThemedText>
    </View>
  );
}

export { CardDetailPane };

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
