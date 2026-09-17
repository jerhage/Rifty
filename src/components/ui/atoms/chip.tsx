import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedText, type ThemedTextType } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget, type Theme, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * How a chip signals that it is on. `accent` fills with the accent color and suits a chip whose
 * own color carries no meaning; `neutral` lifts the surface instead, leaving an adornment free to
 * be the thing that carries color.
 */
type ChipTone = "accent" | "neutral";

interface ChipProps {
  /** Rendered before the label — a color dot, for instance. */
  readonly adornment?: ReactNode;
  readonly label: string;
  readonly labelType?: ThemedTextType;
  readonly onPress: () => void;
  readonly selected: boolean;
  readonly tone?: ChipTone;
}

function Chip({
  adornment,
  label,
  labelType = "small",
  onPress,
  selected,
  tone = "accent",
}: ChipProps) {
  const theme = useTheme();
  const { backgroundColor, borderColor, labelColor } = chipAppearance(theme, tone, selected);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor, borderColor },
        pressed && styles.pressed,
      ]}
    >
      {adornment}
      <ThemedText themeColor={labelColor} type={labelType}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

interface ChipAppearance {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly labelColor: ThemeColor;
}

function chipAppearance(theme: Theme, tone: ChipTone, selected: boolean): ChipAppearance {
  return match({ selected, tone })
    .with({ selected: true, tone: "accent" }, (): ChipAppearance => ({
      backgroundColor: theme.accent,
      borderColor: theme.accent,
      labelColor: "onAccent",
    }))
    .with({ selected: true, tone: "neutral" }, (): ChipAppearance => ({
      backgroundColor: theme.backgroundSelected,
      borderColor: theme.borderStrong,
      labelColor: "text",
    }))
    .with({ selected: false, tone: "accent" }, (): ChipAppearance => ({
      backgroundColor: theme.fill,
      borderColor: theme.border,
      labelColor: "textSecondary",
    }))
    .with({ selected: false, tone: "neutral" }, (): ChipAppearance => ({
      backgroundColor: "transparent",
      borderColor: theme.border,
      labelColor: "textSecondary",
    }))
    .exhaustive();
}

export { Chip };
export type { ChipProps, ChipTone };

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.one + 2,
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
    paddingHorizontal: Spacing.three - 5,
    paddingVertical: Spacing.two - 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
