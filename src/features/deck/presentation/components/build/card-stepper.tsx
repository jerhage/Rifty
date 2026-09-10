import { Pressable, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius } from "@/constants/theme";
import type { CopyAllowance } from "@/features/deck/deck/deck-legality";
import { useTheme } from "@/hooks/use-theme";

type StepperSurface = "inline" | "overlay";

function CardStepper({
  allowance,
  minQuantity,
  onChange,
  quantity,
  surface = "inline",
}: {
  readonly allowance: CopyAllowance;
  readonly minQuantity: number;
  readonly onChange: (quantity: number) => void;
  readonly quantity: number;
  readonly surface?: StepperSurface;
}) {
  const theme = useTheme();
  const atAllowance = match(allowance)
    .with({ type: "unlimited" }, () => false)
    .with({ type: "limited" }, ({ copies }) => quantity >= copies)
    .exhaustive();

  return (
    <View
      style={[
        styles.stepper,
        surface === "overlay"
          ? { backgroundColor: theme.background, borderColor: theme.borderStrong }
          : { backgroundColor: theme.fill, borderColor: theme.border },
      ]}
    >
      <StepButton
        disabled={quantity <= minQuantity}
        label="−"
        onPress={() => onChange(Math.max(minQuantity, quantity - 1))}
      />
      <ThemedText
        style={[styles.quantity, { color: quantity > 0 ? theme.text : theme.textTertiary }]}
        type="monoValue"
      >
        {quantity}
      </ThemedText>
      <StepButton disabled={atAllowance} label="+" onPress={() => onChange(quantity + 1)} />
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

export { CardStepper };
export type { StepperSurface };

const styles = StyleSheet.create({
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
