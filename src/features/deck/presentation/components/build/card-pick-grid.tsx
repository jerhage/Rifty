import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { CardSummary } from "@/features/catalog/card/card-summary";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

function CardPickGrid({
  cards,
  onPick,
  selectedId,
}: {
  readonly cards: readonly CardSummary[];
  readonly onPick: (card: CardSummary) => void;
  readonly selectedId: string | null;
}) {
  return (
    <ScrollView contentContainerStyle={styles.grid}>
      {cards.map((card) => (
        <CardPickTile card={card} key={card.id} onPick={onPick} selected={card.id === selectedId} />
      ))}
    </ScrollView>
  );
}

function CardPickTile({
  card,
  onPick,
  selected,
}: {
  readonly card: CardSummary;
  readonly onPick: (card: CardSummary) => void;
  readonly selected: boolean;
}) {
  const theme = useTheme();
  const domainColors = useDomainColors();
  const accent = domainColors[card.domainIds[0] ?? "Colorless"];

  return (
    <Pressable
      accessibilityLabel={`Choose ${card.name}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
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
      <View style={[styles.frame, { borderColor: theme.border }]}>
        <Image contentFit="contain" source={card.imageUrl} style={styles.image} transition={150} />
        {selected ? (
          <View style={[styles.check, { backgroundColor: accent }]}>
            <ThemedText style={{ color: theme.onAccent }} type="mono">
              ✓
            </ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText numberOfLines={2} type="body" style={styles.name}>
        {card.name}
      </ThemedText>
    </Pressable>
  );
}

export { CardPickGrid };

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three - 5,
    paddingBottom: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  tile: {
    borderRadius: Radius.large - 2,
    borderWidth: 1.5,
    flexBasis: "47%",
    flexGrow: 1,
    padding: Spacing.two + 1,
  },
  frame: {
    aspectRatio: 5 / 7,
    borderRadius: Radius.small + 4,
    borderWidth: StyleSheet.hairlineWidth,
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
    height: 20,
    justifyContent: "center",
    position: "absolute",
    right: Spacing.one + 2,
    width: 20,
  },
  name: {
    fontWeight: 600,
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
