import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import type { HandStats, HandVerdict } from "../../draw-simulation";

function verdictLabel(verdict: HandVerdict): string {
  return match(verdict)
    .with("keepable", () => "keepable")
    .with("risky", () => "risky")
    .exhaustive();
}

function averageLabel(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

function HandStatsPanel({ stats }: { readonly stats: HandStats }) {
  const theme = useTheme();
  const verdictColor = match(stats.verdict)
    .with("keepable", () => theme.positive)
    .with("risky", () => theme.negative)
    .exhaustive();

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <View style={styles.header}>
        <ThemedText themeColor="textTertiary" type="mono">
          This hand
        </ThemedText>
        <View style={[styles.chip, { backgroundColor: theme.fill, borderColor: verdictColor }]}>
          <ThemedText style={{ color: verdictColor }} type="mono">
            {verdictLabel(stats.verdict)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.figures}>
        <View style={styles.figure}>
          <ThemedText type="monoValue">{averageLabel(stats.averageEnergy)}</ThemedText>
          <ThemedText themeColor="textTertiary" style={styles.caption} type="body">
            avg energy
          </ThemedText>
        </View>
        <View style={styles.figure}>
          <ThemedText type="monoValue">{averageLabel(stats.averagePower)}</ThemedText>
          <ThemedText themeColor="textTertiary" style={styles.caption} type="body">
            avg power
          </ThemedText>
        </View>
        <View style={styles.figure}>
          <ThemedText type="monoValue">{stats.earlyPlays}</ThemedText>
          <ThemedText themeColor="textTertiary" style={styles.caption} type="body">
            turn 1-2 plays
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

export { HandStatsPanel };

const styles = StyleSheet.create({
  panel: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three - 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chip: {
    borderRadius: Radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two - 2,
    paddingVertical: Spacing.half,
  },
  figures: {
    flexDirection: "row",
    gap: Spacing.four,
    marginTop: Spacing.three - 2,
  },
  figure: {
    minWidth: 0,
  },
  caption: {
    marginTop: Spacing.half,
  },
});
