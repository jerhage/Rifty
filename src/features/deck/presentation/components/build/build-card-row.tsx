import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import {
  domainAccent,
  formatCardTypeAndAttributes,
} from "@/features/card/presentation/card-taxonomy-format";
import { CardThumb } from "@/features/card/presentation/components/card-thumb";
import { DomainMarks } from "@/features/card/presentation/components/domain-mark";
import type { CopyAllowance } from "@/features/deck/deck/deck-legality";
import { useOpenCardLongPress } from "@/hooks/use-open-card-long-press";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

import { buildCardLabel } from "../../build-card-format";
import { CardStepper } from "./card-stepper";

function BuildCardRow({
  allowance,
  card,
  minQuantity,
  onChange,
  onOpenCard,
  quantity,
}: {
  /** The most this printing may hold here, sharing its allowance with other printings. */
  readonly allowance: CopyAllowance;
  readonly card: Card;
  readonly minQuantity: number;
  readonly onChange: (quantity: number) => void;
  readonly onOpenCard: (card: Card) => void;
  /** What the row reads, which includes the champion's own slot. */
  /** Copies the stepper owns, on top of anything already held. */
  readonly quantity: number;
}) {
  const theme = useTheme();
  const accent = domainAccent(card, useDomainColors());
  const inDeck = quantity > 0;
  const openCard = useOpenCardLongPress(() => onOpenCard(card));

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
        accessibilityHint="Opens the full card"
        accessibilityLabel={buildCardLabel(card, quantity)}
        accessibilityRole="button"
        onLongPress={openCard}
        onPress={() => onOpenCard(card)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
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
      </Pressable>

      <CardStepper
        allowance={allowance}
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
    width: 32,
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
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.one + 1,
    marginTop: Spacing.one,
  },
  subText: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.5,
  },
});
