import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import {
  formatCardTypeAndAttributes,
  spokenCardTypeAndAttributes,
} from "@/features/card/presentation/card-taxonomy-format";
import { CardThumb } from "@/features/card/presentation/components/card-thumb";
import { DomainMarks } from "@/features/card/presentation/components/domain-mark";
import { useTheme } from "@/hooks/use-theme";

function DeckCardRow({
  card,
  onOpenCard,
  quantity,
}: {
  readonly card: Card;
  readonly onOpenCard: (card: Card) => void;
  readonly quantity: number;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={heldCardLabel(card, quantity)}
      accessibilityRole="button"
      onPress={() => onOpenCard(card)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <CardThumb card={card} contentFit="cover" style={styles.thumb} />
      <View style={styles.text}>
        <ThemedText numberOfLines={1} style={styles.name} type="body">
          {card.name}
        </ThemedText>
        <View style={styles.sub}>
          <DomainMarks domainIds={card.domainIds} />
          <ThemedText
            numberOfLines={1}
            style={styles.subText}
            themeColor="textTertiary"
            type="mono"
          >
            {formatCardTypeAndAttributes(card)}
          </ThemedText>
        </View>
      </View>
      <ThemedText themeColor="textSecondary" type="monoValue">
        {quantity}
      </ThemedText>
    </Pressable>
  );
}

function heldCardLabel(card: Card, quantity: number): string {
  const copies = quantity === 1 ? "1 copy" : `${quantity} copies`;

  return `${card.name}, ${copies}, ${spokenCardTypeAndAttributes(card)}`;
}

export { DeckCardRow };

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two + 2,
    minHeight: 58,
    paddingHorizontal: Spacing.two + 1,
    paddingVertical: Spacing.two,
  },
  thumb: {
    borderRadius: Radius.small + 2,
    height: 42,
    width: 32,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: 500,
  },
  sub: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.one + 1,
    marginTop: Spacing.one,
  },
  subText: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
