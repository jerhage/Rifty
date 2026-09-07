import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { deckBuildSteps } from "../../deck-build-steps";

function BuildProgressHeader({
  onBack,
  stepIndex,
}: {
  readonly onBack: () => void;
  readonly stepIndex: number;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const step = deckBuildSteps[stepIndex];

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
          {`New deck · step ${stepIndex + 1} of ${deckBuildSteps.length} · ${step?.label ?? ""}`}
        </ThemedText>
      </View>
      <View style={styles.track}>
        {deckBuildSteps.map((candidate, index) => (
          <View
            key={candidate.id}
            style={[
              styles.segment,
              { backgroundColor: index <= stepIndex ? theme.accent : theme.borderStrong },
            ]}
          />
        ))}
      </View>
    </View>
  );
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
