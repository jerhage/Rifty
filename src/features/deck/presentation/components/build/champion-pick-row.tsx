import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { CardImage } from "@/features/card/presentation/components/card-image";
import { DomainBar } from "@/features/card/presentation/components/domain-bar";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

function ChampionPickRow({
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
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onLongPress={() => onOpenCard(card)}
      onPress={() => onPick(card)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: selected ? accent : theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: theme.background }]}>
        <CardImage contentFit="contain" source={card.imageUrl} style={styles.image} />
        <DomainBar domainIds={card.domainIds} height={2} />
      </View>

      <View style={styles.text}>
        <View style={styles.titleRow}>
          <ThemedText numberOfLines={1} style={styles.name} type="small">
            {card.name}
          </ThemedText>
          <ThemedText style={{ color: accent }} type="mono">
            {card.domainIds.join(" / ") || "Colorless"}
          </ThemedText>
        </View>
        <ThemedText themeColor="textTertiary" type="mono" style={styles.stats}>
          {statsLabel(card)}
        </ThemedText>
      </View>

      <View
        style={[
          styles.mark,
          { backgroundColor: selected ? accent : "transparent", borderColor: theme.borderStrong },
        ]}
      />
    </Pressable>
  );
}

function statsLabel(card: Card): string {
  return [
    card.attributes.energy === null ? null : `${card.attributes.energy} energy`,
    card.attributes.might === null ? null : `${card.attributes.might} might`,
    card.attributes.power === null ? null : `${card.attributes.power} power`,
  ]
    .filter((part): part is string => part !== null)
    .join(" · ");
}

export { ChampionPickRow };

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderRadius: Radius.large - 2,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: Spacing.three - 5,
    minHeight: 76,
    padding: Spacing.two + 2,
  },
  thumb: {
    aspectRatio: 5 / 7,
    borderRadius: Radius.small + 3,
    overflow: "hidden",
    width: 64,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: Spacing.two - 1,
  },
  name: {
    flexShrink: 1,
    fontSize: 13.5,
    fontWeight: 600,
  },
  stats: {
    marginTop: Spacing.one,
  },
  mark: {
    borderRadius: 999,
    borderWidth: 1.5,
    height: 20,
    width: 20,
  },
  pressed: {
    opacity: 0.7,
  },
});
