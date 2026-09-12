import { StyleSheet, View } from "react-native";

import { Panel } from "@/components/ui/atoms/panel";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import type { DrawOdds } from "../../draw-simulation";

interface OddsRow {
  readonly key: string;
  readonly label: string;
  readonly opening: number;
  readonly byTurnThree: number;
}

function oddsRows(odds: DrawOdds): readonly OddsRow[] {
  const pinned = odds.pinned;
  const pinnedRows: readonly OddsRow[] =
    pinned === null
      ? []
      : [
          {
            key: "pinned",
            label: pinned.name,
            opening: pinned.opening,
            byTurnThree: pinned.byTurnThree,
          },
        ];

  return [
    ...pinnedRows,
    ...odds.copyOdds.map((entry) => ({
      key: `copies-${entry.copies}`,
      label: entry.copies === 1 ? "1 copy" : `${entry.copies} copies`,
      opening: entry.opening,
      byTurnThree: entry.byTurnThree,
    })),
  ];
}

function DrawOddsPanel({ odds }: { readonly odds: DrawOdds }) {
  const theme = useTheme();
  const rows = oddsRows(odds);
  const highest = Math.max(0.01, ...rows.map((row) => row.opening));

  return (
    <Panel
      note={
        <ThemedText themeColor="textSecondary" type="mono">
          {`hypergeometric · ${odds.poolSize} cards`}
        </ThemedText>
      }
      title="Draw odds"
    >
      <View style={styles.rows}>
        {rows.map((row) => (
          <View accessible accessibilityLabel={oddsLabel(row)} key={row.key} style={styles.row}>
            <ThemedText style={styles.label} type="body">
              {row.label}
            </ThemedText>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.track, { backgroundColor: theme.fill }]}
            >
              <View
                style={[
                  styles.bar,
                  { backgroundColor: theme.accent, width: `${(row.opening / highest) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.figures}>
              <ThemedText style={{ color: theme.accent }} type="monoValue">
                {`${Math.round(row.opening * 100)}%`}
              </ThemedText>
              <ThemedText themeColor="textTertiary" type="mono">
                {`by T3 ${Math.round(row.byTurnThree * 100)}%`}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </Panel>
  );
}

function oddsLabel(row: OddsRow): string {
  const opening = Math.round(row.opening * 100);
  const byTurnThree = Math.round(row.byTurnThree * 100);

  return `${row.label}, opening hand ${opening}%, by turn three ${byTurnThree}%`;
}

export { DrawOddsPanel };

const styles = StyleSheet.create({
  rows: {
    gap: Spacing.two + 2,
    marginTop: Spacing.three - 2,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two + 2,
  },
  label: {
    flexShrink: 1,
    fontWeight: 500,
    minWidth: 96,
  },
  track: {
    borderRadius: 3,
    flexBasis: 64,
    flexGrow: 1,
    flexShrink: 1,
    height: 6,
    minWidth: 48,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
  },
  figures: {
    alignItems: "flex-end",
    flexShrink: 1,
    minWidth: 76,
  },
});
