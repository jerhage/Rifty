import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { Panel } from "@/components/ui/atoms/panel";
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
    <Panel
      note={
        <View style={[styles.chip, { backgroundColor: theme.fill, borderColor: verdictColor }]}>
          <ThemedText style={{ color: verdictColor }} type="mono">
            {verdictLabel(stats.verdict)}
          </ThemedText>
        </View>
      }
      title="This hand"
    >
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
    </Panel>
  );
}

export { HandStatsPanel };

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two - 2,
    paddingVertical: Spacing.half,
  },
  figures: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.four,
    marginTop: Spacing.three - 2,
  },
  figure: {
    flexShrink: 1,
    minWidth: 0,
  },
  caption: {
    marginTop: Spacing.half,
  },
});
