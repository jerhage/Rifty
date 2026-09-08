import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { DomainBar } from "@/components/ui/atoms/domain-bar";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/catalog/card/card";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

function BuildCardRow({
  card,
  displayedQuantity,
  maxQuantity,
  onChange,
  onOpenCard,
  quantity,
}: {
  readonly card: Card;
  /** The most this printing may hold here, sharing its allowance with other printings. */
  readonly maxQuantity: number | null;
  readonly onChange: (quantity: number) => void;
  readonly onOpenCard: (card: Card) => void;
  /** What the row reads, which includes the champion's own slot. */
  readonly displayedQuantity: number;
  /** Copies the stepper owns, on top of anything already held. */
  readonly quantity: number;
}) {
  const theme = useTheme();
  const domainColors = useDomainColors();
  const accent = domainColors[card.domainIds[0] ?? "Colorless"];
  const inDeck = displayedQuantity > 0;

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
        accessibilityHint="Press and hold to see the full card"
        accessibilityLabel={card.name}
        accessibilityRole="button"
        onLongPress={() => onOpenCard(card)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={[styles.thumb, { backgroundColor: theme.background }]}>
          <Image contentFit="cover" source={card.imageUrl} style={styles.image} transition={150} />
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
      </Pressable>

      <View style={[styles.stepper, { backgroundColor: theme.fill, borderColor: theme.border }]}>
        <StepButton
          disabled={quantity === 0}
          label="−"
          onPress={() => onChange(Math.max(0, quantity - 1))}
        />
        <ThemedText
          style={[styles.quantity, { color: inDeck ? theme.text : theme.textTertiary }]}
          type="monoValue"
        >
          {displayedQuantity}
        </ThemedText>
        <StepButton
          disabled={maxQuantity !== null && quantity >= maxQuantity}
          label="+"
          onPress={() => onChange(quantity + 1)}
        />
      </View>
    </View>
  );
}

function StepButton({
  disabled,
  label,
  onPress,
}: {
  readonly disabled: boolean;
  readonly label: string;
  readonly onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={label === "+" ? "Add a copy" : "Remove a copy"}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.step, pressed && styles.pressed]}
    >
      <ThemedText
        style={[styles.stepLabel, { color: disabled ? theme.border : theme.textSecondary }]}
      >
        {label}
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
    overflow: "hidden",
    width: 32,
  },
  image: {
    height: "100%",
    width: "100%",
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
    marginTop: Spacing.one,
  },
  stepper: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    padding: 2,
  },
  step: {
    alignItems: "center",
    borderRadius: Radius.medium,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  stepLabel: {
    fontSize: 16,
  },
  quantity: {
    fontSize: 13,
    textAlign: "center",
    width: 20,
  },
  pressed: {
    opacity: 0.5,
  },
});
