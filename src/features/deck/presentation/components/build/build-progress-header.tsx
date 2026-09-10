import { Pressable, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { DECK_BUILD_STEPS, type DeckBuildStep } from "../../deck-build-steps";
import type { DeckBuildMode } from "../../deck-build-start";

function BuildProgressHeader({
  mode,
  onBack,
  step,
}: {
  readonly mode: DeckBuildMode;
  readonly onBack: () => void;
  readonly step: DeckBuildStep;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.titleRow}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.back,
            { backgroundColor: theme.fill },
            pressed && styles.pressed,
          ]}
        >
          <ThemedText type="small">←</ThemedText>
        </Pressable>
        <ThemedText themeColor="textSecondary" type="mono">
          {`${modeLabel(mode)} · step ${step.ordinal} of ${DECK_BUILD_STEPS.length} · ${step.label}`}
        </ThemedText>
      </View>
      <View style={styles.track}>
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

function modeLabel(mode: DeckBuildMode): string {
  return match(mode)
    .with("new", () => "New deck")
    .with("edit", () => "Edit deck")
    .exhaustive();
}

export { BuildProgressHeader };

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two + 2,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.three - 4,
  },
  back: {
    alignItems: "center",
    borderRadius: Radius.medium,
    height: 32,
    justifyContent: "center",
    width: 32,
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
  pressed: {
    opacity: 0.7,
  },
});
