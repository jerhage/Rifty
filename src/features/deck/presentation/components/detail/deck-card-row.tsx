import { Pressable, StyleSheet, View } from "react-native";

import { CardImage } from "@/components/ui/atoms/card-image";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { DomainBar } from "@/features/card/presentation/components/domain-bar";
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
      <View style={[styles.thumb, { backgroundColor: theme.background }]}>
        <CardImage contentFit="cover" source={card.imageUrl} style={styles.image} />
        <DomainBar domainIds={card.domainIds} height={2} />
      </View>
      <View style={styles.text}>
        <ThemedText numberOfLines={1} style={styles.name} type="body">
          {card.name}
        </ThemedText>
        <ThemedText numberOfLines={1} themeColor="textTertiary" type="mono" style={styles.sub}>
          {subtitle(card)}
        </ThemedText>
      </View>
      <ThemedText themeColor="textSecondary" type="monoValue">
        {quantity}
      </ThemedText>
    </Pressable>
  );
}

function subtitle(card: Card): string {
  const energy = card.attributes.energy === null ? null : `${card.attributes.energy}E`;
  const might = card.attributes.might === null ? null : `${card.attributes.might}M`;

  return [card.classification.typeId, energy, might]
    .filter((part): part is string => part !== null)
    .join(" · ");
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
    overflow: "hidden",
    width: 32,
  },
  image: {
    height: "100%",
    width: "100%",
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
