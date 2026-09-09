import { Pressable, StyleSheet, View } from "react-native";

import { CardImage } from "@/components/ui/atoms/card-image";
import { DomainBar } from "@/components/ui/atoms/domain-bar";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/catalog/card/card";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

function LegendPickTile({
  card,
  onOpenCard,
  onPick,
  selected,
}: {
  readonly card: Card;
  readonly onOpenCard: (card: Card) => void;
  readonly onPick: (card: Card) => void;
  readonly selected: boolean;
}) {
  const theme = useTheme();
  const domainColors = useDomainColors();
  const accent = domainColors[card.domainIds[0] ?? "Colorless"];

  return (
    <Pressable
      accessibilityHint="Press and hold to see the full card"
      accessibilityLabel={`Choose ${card.name}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onLongPress={() => onOpenCard(card)}
      onPress={() => onPick(card)}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: selected ? accent : theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.art, { backgroundColor: theme.background }]}>
        <CardImage contentFit="contain" source={card.imageUrl} style={styles.image} />
        {selected ? (
          <View style={[styles.check, { backgroundColor: accent }]}>
            <ThemedText style={[styles.checkMark, { color: theme.onAccent }]} type="mono">
              ✓
            </ThemedText>
          </View>
        ) : null}
        <DomainBar domainIds={card.domainIds} height={2.5} />
      </View>
      <ThemedText numberOfLines={2} type="body" style={styles.name}>
        {card.name}
      </ThemedText>
    </Pressable>
  );
}

export { LegendPickTile };

const styles = StyleSheet.create({
  tile: {
    borderRadius: Radius.large - 2,
    borderWidth: 1.5,
    flexBasis: "47%",
    flexGrow: 1,
    padding: Spacing.two + 1,
  },
  art: {
    aspectRatio: 5 / 7,
    borderRadius: Radius.small + 4,
    overflow: "hidden",
    width: "100%",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  check: {
    alignItems: "center",
    borderRadius: 999,
    bottom: Spacing.one + 2,
    height: 18,
    justifyContent: "center",
    position: "absolute",
    right: Spacing.one + 2,
    width: 18,
  },
  checkMark: {
    fontWeight: 700,
  },
  name: {
    fontSize: 12.5,
    fontWeight: 600,
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
