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
        <ThemedText type="heading">{group.title}</ThemedText>
        <ThemedText themeColor="textTertiary" type="mono">
          {group.count}
        </ThemedText>
      </View>
      {group.cards.map((held) => (
        <DeckCardRow
          card={held.card}
          key={held.card.printingId}
          onOpenCard={onOpenCard}
          quantity={held.quantity}
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
    justifyContent: "space-between",
    marginBottom: Spacing.one,
  },
});
