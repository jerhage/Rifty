import { Pressable, StyleSheet, View, type AccessibilityValue } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, TouchTarget } from "@/constants/theme";
import type { CopyAllowance } from "@/features/deck/deck/deck-legality";
import { useTheme } from "@/hooks/use-theme";

type StepperSurface = "inline" | "overlay";

const STEP_SIZE = 30;

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
  const value = match(allowance)
    .returnType<AccessibilityValue>()
    .with({ type: "unlimited" }, () => ({ min: minQuantity, now: quantity }))
    .with({ type: "limited" }, ({ copies }) => ({ min: minQuantity, max: copies, now: quantity }))
    .exhaustive();
  const atMinimum = quantity <= minQuantity;

  function addCopy() {
    if (!atAllowance) {
      onChange(quantity + 1);
    }
  }

  function removeCopy() {
    if (!atMinimum) {
      onChange(quantity - 1);
    }
  }

  return (
    <View
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      accessibilityLabel="Copies"
      accessibilityRole="adjustable"
      accessibilityValue={value}
      accessible
      onAccessibilityAction={(event) =>
        match(event.nativeEvent.actionName)
          .with("increment", addCopy)
          .with("decrement", removeCopy)
          .otherwise(() => undefined)
      }
      style={[
        styles.stepper,
        surface === "overlay"
          ? { backgroundColor: theme.background, borderColor: theme.borderStrong }
          : { backgroundColor: theme.fill, borderColor: theme.border },
      ]}
    >
      <StepButton disabled={atMinimum} label="−" onPress={removeCopy} />
      <ThemedText
        style={[styles.quantity, { color: quantity > 0 ? theme.text : theme.textTertiary }]}
        type="monoValue"
      >
        {quantity}
      </ThemedText>
      <StepButton disabled={atAllowance} label="+" onPress={addCopy} />
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
      accessibilityElementsHidden
      disabled={disabled}
      hitSlop={TouchTarget.slop(STEP_SIZE)}
      importantForAccessibility="no-hide-descendants"
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
    height: STEP_SIZE,
    justifyContent: "center",
    width: STEP_SIZE,
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
