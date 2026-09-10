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
          <View key={row.key} style={styles.row}>
            <ThemedText numberOfLines={1} style={styles.label} type="body">
              {row.label}
            </ThemedText>
            <View style={[styles.track, { backgroundColor: theme.fill }]}>
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

export { DrawOddsPanel };

const styles = StyleSheet.create({
  rows: {
    gap: Spacing.two + 2,
    marginTop: Spacing.three - 2,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two + 2,
  },
  label: {
    flexBasis: 96,
    flexShrink: 0,
    fontWeight: 500,
  },
  track: {
    borderRadius: 3,
    flex: 1,
    height: 6,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
  },
  figures: {
    alignItems: "flex-end",
    flexBasis: 76,
    flexShrink: 0,
  },
});
