import { Pressable, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { CardImage } from "@/components/ui/atoms/card-image";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { DomainBar } from "@/features/card/presentation/components/domain-bar";
import { useOpenCardHapticLongPress } from "@/hooks/use-open-card-haptic-long-press";
import { useTheme } from "@/hooks/use-theme";

import { SHOW_FULL_CARD, SHOW_FULL_CARD_ACTIONS } from "../../show-full-card-action";

function HandCardTile({
  card,
  onOpenCard,
  onToggleSelection,
  selected,
}: {
  readonly card: Card;
  readonly onOpenCard: (card: Card) => void;
  readonly onToggleSelection: () => void;
  readonly selected: boolean;
}) {
  const theme = useTheme();
  const openCard = useOpenCardHapticLongPress(() => onOpenCard(card));

  return (
    <Pressable
      accessibilityActions={SHOW_FULL_CARD_ACTIONS}
      accessibilityLabel={handCardLabel(card)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onAccessibilityAction={(event) =>
        match(event.nativeEvent.actionName)
          .with(SHOW_FULL_CARD, () => onOpenCard(card))
          .otherwise(() => undefined)
      }
      onLongPress={openCard}
      onPress={onToggleSelection}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.art,
          {
            backgroundColor: theme.background,
            borderColor: selected ? theme.accent : theme.border,
            borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        <CardImage
          alternative={{ type: "decorative" }}
          contentFit="cover"
          source={card.imageUrl}
          style={styles.image}
        />
        {card.attributes.energy === null ? null : (
          <View style={[styles.cost, { backgroundColor: theme.backgroundSheet }]}>
            <ThemedText type="mono">{`${card.attributes.energy}E`}</ThemedText>
          </View>
        )}
        {selected ? (
          <>
            <View style={[styles.scrim, { backgroundColor: theme.background }]} />
            <View style={[styles.badge, { backgroundColor: theme.accent }]}>
              <ThemedText maxFontSizeMultiplier={1.2} themeColor="onAccent" type="smallBold">
                ✓
              </ThemedText>
            </View>
            <ThemedText style={[styles.caption, { color: theme.accent }]} type="mono">
              mulligan
            </ThemedText>
          </>
        ) : null}
        <DomainBar domainIds={card.domainIds} height={2} />
      </View>
      <ThemedText
        numberOfLines={2}
        style={styles.name}
        themeColor={selected ? "text" : "textSecondary"}
        type="body"
      >
        {card.name}
      </ThemedText>
    </Pressable>
  );
}

function handCardLabel(card: Card): string {
  const energy = card.attributes.energy;

  return energy === null ? card.name : `${card.name}, ${energy} energy`;
}

export { HandCardTile };

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
  },
  art: {
    borderRadius: Radius.medium,
    height: 104,
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  cost: {
    borderBottomRightRadius: Radius.small - 2,
    borderTopLeftRadius: Radius.small - 2,
    left: 0,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.half,
    position: "absolute",
    top: 0,
  },
  scrim: {
    bottom: 0,
    left: 0,
    opacity: 0.55,
    position: "absolute",
    right: 0,
    top: 0,
  },
  badge: {
    alignItems: "center",
    borderRadius: Radius.medium,
    justifyContent: "center",
    minHeight: 20,
    minWidth: 20,
    paddingHorizontal: Spacing.half,
    position: "absolute",
    right: Spacing.one,
    top: Spacing.one,
  },
  caption: {
    bottom: Spacing.two,
    left: 0,
    position: "absolute",
    right: 0,
    textAlign: "center",
  },
  name: {
    marginTop: Spacing.one + 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
