import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";

import type { DeckGroup } from "../../deck-contents";
import { DeckCardRow } from "./deck-card-row";

function DeckSectionGroup({
  group,
  onOpenCard,
}: {
  readonly group: DeckGroup;
  readonly onOpenCard: (card: Card) => void;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <ThemedText accessibilityRole="header" type="heading">
          {group.title}
        </ThemedText>
        <ThemedText
          accessibilityLabel={group.count === 1 ? "1 card" : `${group.count} cards`}
          themeColor="textTertiary"
          type="mono"
        >
          {group.count}
        </ThemedText>
      </View>
      {group.cards.map((copy) => (
        <DeckCardRow
          card={copy.card}
          key={copy.card.printingId}
          onOpenCard={onOpenCard}
          quantity={copy.quantity}
        />
      ))}
    </View>
  );
}

export { DeckSectionGroup };

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two - 1,
    marginTop: Spacing.four,
  },
  groupHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    justifyContent: "space-between",
    marginBottom: Spacing.one,
  },
});
