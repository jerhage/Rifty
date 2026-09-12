import { Pressable, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { CardImage } from "@/components/ui/atoms/card-image";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { domainAccent } from "@/features/card/presentation/card-taxonomy-format";
import { DomainBar } from "@/features/card/presentation/components/domain-bar";
import { useOpenCardLongPress } from "@/hooks/use-open-card-long-press";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

import { SHOW_FULL_CARD, SHOW_FULL_CARD_ACTIONS } from "../../show-full-card-action";

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
  const accent = domainAccent(card, useDomainColors());
  const openCard = useOpenCardLongPress(() => onOpenCard(card));

  return (
    <Pressable
      accessibilityActions={SHOW_FULL_CARD_ACTIONS}
      accessibilityLabel={`Choose ${card.name}`}
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
        styles.tile,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: selected ? accent : theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.art, { backgroundColor: theme.background }]}>
        <CardImage
          alternative={{ type: "decorative" }}
          contentFit="contain"
          source={card.imageUrl}
          style={styles.image}
        />
        {selected ? (
          <View style={[styles.check, { backgroundColor: accent }]}>
            <ThemedText
              maxFontSizeMultiplier={1.2}
              style={[styles.checkMark, { color: theme.onAccent }]}
              type="mono"
            >
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
    justifyContent: "center",
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: Spacing.half,
    position: "absolute",
    right: Spacing.one + 2,
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
