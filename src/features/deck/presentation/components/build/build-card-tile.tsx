import { useImage } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { Skeleton } from "@/components/ui/atoms/skeleton";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { formatCardTypeAndAttributes } from "@/features/card/presentation/card-taxonomy-format";
import { CARD_ASPECT_RATIO, CardArt } from "@/features/card/presentation/components/card-art";
import { DomainBar } from "@/features/card/presentation/components/domain-bar";
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
  const domainColors = useDomainColors();
  const image = useImage(card.imageUrl, {
    maxHeight: 720,
    maxWidth: 512,
    // TODO: send this to Sentry once error reporting is wired up.
    onError: () => undefined,
  });
  const accent = domainColors[card.domainIds[0] ?? "Colorless"];
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
        {image ? (
          <CardArt image={image} isLandscape={card.orientation === "landscape"} width={width} />
        ) : (
          <Skeleton style={StyleSheet.absoluteFill} />
        )}
        <DomainBar domainIds={card.domainIds} />

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
