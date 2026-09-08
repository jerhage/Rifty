import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type StepperSurface = "inline" | "overlay";

/** Over card art the plate has to be opaque, or the glyphs disappear into the painting. */
function CardStepper({
  displayedQuantity,
  maxQuantity,
  onChange,
  quantity,
  surface = "inline",
}: {
  /** What the stepper reads, which includes the champion's own slot. */
  readonly displayedQuantity: number;
  /** The most this printing may hold here, sharing its allowance with other printings. */
  readonly maxQuantity: number | null;
  readonly onChange: (quantity: number) => void;
  /** Copies the stepper owns, on top of anything already held. */
  readonly quantity: number;
  readonly surface?: StepperSurface;
}) {
  const theme = useTheme();

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
        disabled={quantity === 0}
        label="−"
        onPress={() => onChange(Math.max(0, quantity - 1))}
      />
      <ThemedText
        style={[
          styles.quantity,
          { color: displayedQuantity > 0 ? theme.text : theme.textTertiary },
        ]}
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
