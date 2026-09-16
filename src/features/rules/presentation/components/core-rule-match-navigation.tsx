import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ChevronGlyph, type ChevronDirection } from "@/components/ui/icons/chevron-glyph";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import type { ActiveCoreRuleHit, CoreRuleSearch } from "@/features/rules/core-rule-search";
import { coreRuleHighlightWash } from "@/features/rules/presentation/core-rule-highlight";
import { coreRuleHitPositionLabel } from "@/features/rules/presentation/core-rules-format";
import { useTheme } from "@/hooks/use-theme";

interface CoreRuleMatchNavigationProps {
  readonly activeHit: ActiveCoreRuleHit;
  readonly matchesOnly: boolean;
  readonly onStepToNextHit: () => void;
  readonly onStepToPreviousHit: () => void;
  readonly onToggleMatchesOnly: () => void;
  readonly search: CoreRuleSearch;
}

/**
 * Where the reader stands among the query's hits, and the two controls that step between them. It
 * shows only while there is a query, so the header is one row shorter for a reader who is reading.
 */
function CoreRuleMatchNavigation({
  activeHit,
  matchesOnly,
  onStepToNextHit,
  onStepToPreviousHit,
  onToggleMatchesOnly,
  search,
}: CoreRuleMatchNavigationProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <CoreRuleHitStep direction="left" label="Previous hit" onPress={onStepToPreviousHit} />
      <CoreRuleHitStep direction="right" label="Next hit" onPress={onStepToNextHit} />
      <ThemedText style={[styles.position, { color: theme.highlight }]} type="monoValue">
        {coreRuleHitPositionLabel(search, activeHit)}
      </ThemedText>
      <CoreRuleMatchesOnlyToggle matchesOnly={matchesOnly} onToggle={onToggleMatchesOnly} />
    </View>
  );
}

function CoreRuleHitStep({
  direction,
  label,
  onPress,
}: {
  readonly direction: ChevronDirection;
  readonly label: string;
  readonly onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.step,
        { backgroundColor: theme.fill, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <ChevronGlyph color={theme.textSecondary} direction={direction} />
    </Pressable>
  );
}

function CoreRuleMatchesOnlyToggle({
  matchesOnly,
  onToggle,
}: {
  readonly matchesOnly: boolean;
  readonly onToggle: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: matchesOnly }}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.toggle,
        {
          backgroundColor: matchesOnly ? coreRuleHighlightWash(theme, "row") : theme.fill,
          borderColor: matchesOnly ? coreRuleHighlightWash(theme, "bar") : theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText
        style={{ color: matchesOnly ? theme.highlight : theme.textSecondary }}
        type="mono"
      >
        Matches only
      </ThemedText>
    </Pressable>
  );
}

export { CoreRuleMatchNavigation };
export type { CoreRuleMatchNavigationProps };

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
  },
  step: {
    alignItems: "center",
    borderRadius: Radius.medium - 2,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
  },
  position: {
    flexShrink: 1,
    minWidth: 0,
  },
  toggle: {
    alignItems: "center",
    borderRadius: Radius.medium - 2,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    marginLeft: "auto",
    minHeight: TouchTarget.minimum,
    paddingHorizontal: Spacing.three - 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
