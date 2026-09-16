import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/ui/atoms/icon-button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { CardFinder } from "@/features/card/card-finder";
import { CardDetailData } from "@/features/card/presentation/data/card-detail-data";
import { CardDetailScreen } from "@/features/card/presentation/screens/card-detail-screen";
import type { PrintingId } from "@/features/card/value-objects/printing-id";

function CardDetailPane({
  bookmarkControl,
  cardFinder,
  notes,
  onClose,
  printingId,
}: {
  readonly bookmarkControl: ReactNode;
  readonly cardFinder: CardFinder;
  readonly notes: ReactNode;
  readonly onClose: () => void;
  readonly printingId: PrintingId | null;
}) {
  const insets = useSafeAreaInsets();

  if (printingId === null) return <IdleCardPane />;

  return (
    <ThemedView style={styles.pane}>
      <View style={[styles.closeRow, { paddingTop: insets.top + Spacing.two }]}>
        <IconButton accessibilityLabel="Close the card" glyph="✕" onPress={onClose} />
      </View>
      <CardDetailData cardFinder={cardFinder} printingId={printingId}>
        {(card) => <CardDetailScreen bookmarkControl={bookmarkControl} card={card} notes={notes} />}
      </CardDetailData>
    </ThemedView>
  );
}

function IdleCardPane() {
  return (
    <ThemedView style={styles.idle}>
      <ThemedText accessibilityRole="header" type="heading">
        No card open
      </ThemedText>
      <ThemedText themeColor="textSecondary" type="body" style={styles.idleNote}>
        Pick a card from the grid and it opens here, without leaving the catalog.
      </ThemedText>
    </ThemedView>
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
