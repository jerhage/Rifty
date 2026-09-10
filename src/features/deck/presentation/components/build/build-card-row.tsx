import { Pressable, StyleSheet, View } from "react-native";

import { CardImage } from "@/components/ui/atoms/card-image";
import { DomainBar } from "@/components/ui/atoms/domain-bar";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

import { poolCardSubtitle } from "../../deck-zone-pool";
import { CardStepper } from "./card-stepper";

function BuildCardRow({
  card,
  maxQuantity,
  minQuantity,
  onChange,
  onOpenCard,
  quantity,
}: {
  readonly card: Card;
  /** The most this printing may hold here, sharing its allowance with other printings. */
  readonly maxQuantity: number | null;
  readonly minQuantity: number;
  readonly onChange: (quantity: number) => void;
  readonly onOpenCard: (card: Card) => void;
  /** What the row reads, which includes the champion's own slot. */
  /** Copies the stepper owns, on top of anything already held. */
  readonly quantity: number;
}) {
  const theme = useTheme();
  const domainColors = useDomainColors();
  const accent = domainColors[card.domainIds[0] ?? "Colorless"];
  const inDeck = quantity > 0;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: inDeck ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: inDeck ? accent : theme.border,
        },
      ]}
    >
      <Pressable
        accessibilityHint="Press and hold to see the full card"
        accessibilityLabel={card.name}
        accessibilityRole="button"
        onLongPress={() => onOpenCard(card)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={[styles.thumb, { backgroundColor: theme.background }]}>
          <CardImage contentFit="cover" source={card.imageUrl} style={styles.image} />
          <DomainBar domainIds={card.domainIds} height={2} />
        </View>

        <View style={styles.text}>
          <ThemedText numberOfLines={1} style={styles.name} type="body">
            {card.name}
          </ThemedText>
          <ThemedText numberOfLines={1} themeColor="textTertiary" type="mono" style={styles.sub}>
            {poolCardSubtitle(card)}
          </ThemedText>
        </View>
      </Pressable>

      <CardStepper
        maxQuantity={maxQuantity}
        minQuantity={minQuantity}
        onChange={onChange}
        quantity={quantity}
      />
    </View>
  );
}

export { BuildCardRow };

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
    overflow: "hidden",
    width: 32,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  card: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: Spacing.two + 2,
    minWidth: 0,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 12.5,
    fontWeight: 500,
  },
  sub: {
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.5,
  },
});
