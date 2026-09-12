import { Pressable, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import {
  cardAttributeParts,
  cardDomainNames,
  domainAccent,
  formatCardAttributes,
  formatDomains,
} from "@/features/card/presentation/card-taxonomy-format";
import { CardThumb } from "@/features/card/presentation/components/card-thumb";
import { useHapticLongPress } from "@/hooks/use-haptic-long-press";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

import { SHOW_FULL_CARD, SHOW_FULL_CARD_ACTIONS } from "./show-full-card-action";

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
  const accent = domainAccent(card, useDomainColors());
  const openCard = useHapticLongPress(() => onOpenCard(card));

  return (
    <Pressable
      accessibilityActions={SHOW_FULL_CARD_ACTIONS}
      accessibilityLabel={championLabel(card)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onAccessibilityAction={(event) =>
        match(event.nativeEvent.actionName)
          .with(SHOW_FULL_CARD, () => onOpenCard(card))
          .otherwise(() => undefined)
      }
      onLongPress={openCard}
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
      <CardThumb card={card} contentFit="contain" style={styles.thumb} />

      <View style={styles.text}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.name} type="small">
            {card.name}
          </ThemedText>
          <ThemedText style={{ color: accent }} type="mono">
            {formatDomains(card)}
          </ThemedText>
        </View>
        <ThemedText themeColor="textTertiary" type="mono" style={styles.stats}>
          {formatCardAttributes(card)}
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

function championLabel(card: Card): string {
  const described = [card.name, ...cardDomainNames(card.domainIds), ...cardAttributeParts(card)];

  return `${described.join(", ")}. Choose`;
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
    width: 64,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    alignItems: "baseline",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two - 1,
  },
  name: {
    flexShrink: 1,
    fontSize: 13.5,
    fontWeight: 600,
    minWidth: 0,
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
