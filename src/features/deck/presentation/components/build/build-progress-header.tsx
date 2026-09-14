import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/ui/atoms/icon-button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { DECK_BUILD_STEPS, type DeckBuildStep } from "../../deck-build-steps";
import type { DeckBuildMode } from "../../deck-build-mode";

function BuildProgressHeader({
  mode,
  onBack,
  onClose,
  step,
}: {
  readonly mode: DeckBuildMode["type"];
  readonly onBack: () => void;
  readonly onClose: () => void;
  readonly step: DeckBuildStep;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          paddingLeft: insets.left + Spacing.three,
          paddingRight: insets.right + Spacing.three,
          paddingTop: insets.top + Spacing.two,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <IconButton accessibilityLabel="Back" glyph="←" onPress={onBack} />
        <ThemedText
          accessibilityLabel={`${modeLabel(mode)}, step ${step.ordinal} of ${DECK_BUILD_STEPS.length}, ${step.label}`}
          style={styles.label}
          themeColor="textSecondary"
          type="mono"
        >
          {`${modeLabel(mode)} · step ${step.ordinal} of ${DECK_BUILD_STEPS.length} · ${step.label}`}
        </ThemedText>
        <IconButton accessibilityLabel="Close without saving" glyph="✕" onPress={onClose} />
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.track}
      >
        {DECK_BUILD_STEPS.map((candidate) => (
          <View
            key={candidate.id}
            style={[
              styles.segment,
              {
                backgroundColor:
                  candidate.ordinal <= step.ordinal ? theme.accent : theme.borderStrong,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function modeLabel(mode: DeckBuildMode["type"]): string {
  return match(mode)
    .with("create", () => "New deck")
    .with("edit", () => "Edit deck")
    .exhaustive();
}

export { BuildProgressHeader };

const styles = StyleSheet.create({
  header: {
    paddingBottom: Spacing.two + 2,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.three - 4,
  },
  label: {
    flex: 1,
  },
  track: {
    flexDirection: "row",
    gap: Spacing.one + 1,
    marginTop: Spacing.three - 4,
  },
  segment: {
    borderRadius: 2,
    flex: 1,
    height: 3,
  },
});
