import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { formatCardTypeAndAttributes } from "@/features/card/presentation/card-taxonomy-format";
import { CardThumb } from "@/features/card/presentation/components/card-thumb";
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
      accessibilityLabel={`${quantity} copies of ${card.name}`}
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
        <ThemedText numberOfLines={1} themeColor="textTertiary" type="mono" style={styles.sub}>
          {formatCardTypeAndAttributes(card)}
        </ThemedText>
      </View>
      <ThemedText themeColor="textSecondary" type="monoValue">
        {quantity}
      </ThemedText>
    </Pressable>
  );
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
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
