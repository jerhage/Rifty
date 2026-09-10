import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import {
  domainAccent,
  formatCardTypeAndAttributes,
} from "@/features/card/presentation/card-taxonomy-format";
import { CARD_ASPECT_RATIO } from "@/features/card/presentation/components/card-art";
import { CardFace } from "@/features/card/presentation/components/card-face";
import type { CopyAllowance } from "@/features/deck/deck/deck-legality";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

import { CardStepper } from "./card-stepper";

function BuildCardTile({
  allowance,
  card,
  minQuantity,
  onChange,
  onOpenCard,
  quantity,
  width,
}: {
  readonly allowance: CopyAllowance;
  readonly card: Card;
  readonly minQuantity: number;
  readonly onChange: (quantity: number) => void;
  readonly onOpenCard: (card: Card) => void;
  readonly quantity: number;
  readonly width: number | null;
}) {
  const theme = useTheme();
  const accent = domainAccent(card, useDomainColors());
  const inDeck = quantity > 0;

  return (
    <View style={[styles.tile, width === null ? undefined : { flexBasis: width, width }]}>
      <Pressable
        accessibilityHint="Press and hold to see the full card"
        accessibilityLabel={card.name}
        accessibilityRole="button"
        onLongPress={() => onOpenCard(card)}
        style={({ pressed }) => [
          styles.frame,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: inDeck ? accent : theme.border,
          },
          pressed && styles.pressed,
        ]}
      >
        <CardFace
          domainIds={card.domainIds}
          imageUrl={card.imageUrl}
          orientation={card.orientation}
          width={width}
        />

        <View style={styles.stepper}>
          <CardStepper
            allowance={allowance}
            minQuantity={minQuantity}
            onChange={onChange}
            quantity={quantity}
            surface="overlay"
          />
        </View>
      </Pressable>

      <ThemedText numberOfLines={2} style={styles.name} type="body">
        {card.name}
      </ThemedText>
      <ThemedText numberOfLines={1} style={styles.sub} themeColor="textTertiary" type="mono">
        {formatCardTypeAndAttributes(card)}
      </ThemedText>
    </View>
  );
}

export { BuildCardTile };

const styles = StyleSheet.create({
  tile: {
    flexBasis: "50%",
    flexGrow: 0,
    flexShrink: 1,
  },
  frame: {
    aspectRatio: CARD_ASPECT_RATIO,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    width: "100%",
  },
  stepper: {
    bottom: Spacing.two,
    position: "absolute",
    right: Spacing.two,
  },
  name: {
    fontWeight: 500,
    marginTop: Spacing.two - 1,
  },
  sub: {
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
