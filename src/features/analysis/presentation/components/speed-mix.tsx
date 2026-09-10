import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ColorDot } from "@/components/ui/atoms/color-dot";
import { Panel } from "@/components/ui/atoms/panel";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { cardSpeedName, type CardSpeed } from "@/features/card/value-objects/card-speed";
import { useSpeedColors, useTheme } from "@/hooks/use-theme";

import type { SpeedShare } from "../../card-metrics";

function speedNote(speed: CardSpeed): string {
  return match(speed)
    .with("normal", () => "your turn, empty stack")
    .with("action", () => "any time you hold priority")
    .with("reaction", () => "in response, off-turn")
    .exhaustive();
}

function SpeedMix({
  cardCount,
  speeds,
}: {
  readonly cardCount: number;
  readonly speeds: readonly SpeedShare[];
}) {
  const theme = useTheme();
  const speedColors = useSpeedColors();
  const present = speeds.filter((entry) => entry.count > 0);
  const counted = present.reduce((total, entry) => total + entry.count, 0);

  return (
    <Panel
      note={
        <ThemedText themeColor="textSecondary" type="mono">
          {cardCount === 1 ? "1 card" : `${cardCount} cards`}
        </ThemedText>
      }
      title="Speed mix"
    >
      <View style={[styles.bar, { backgroundColor: theme.fill }]}>
        {present.map((entry) => (
          <View
            key={entry.speed}
            style={{
              backgroundColor: speedColors[entry.speed],
              flexGrow: entry.count,
              height: "100%",
            }}
          />
        ))}
      </View>

      <View style={styles.rows}>
        {speeds.map((entry) => (
          <View key={entry.speed} style={styles.row}>
            <ColorDot color={speedColors[entry.speed]} shape="diamond" size={9} />
            <View style={styles.label}>
              <ThemedText type="body" style={styles.name}>
                {cardSpeedName(entry.speed)}
              </ThemedText>
              <ThemedText
                numberOfLines={1}
                themeColor="textTertiary"
                type="body"
                style={styles.note}
              >
                {speedNote(entry.speed)}
              </ThemedText>
            </View>
            <View style={styles.figures}>
              <ThemedText style={{ color: speedColors[entry.speed] }} type="monoValue">
                {`${Math.round(entry.share * 100)}%`}
              </ThemedText>
              <ThemedText themeColor="textTertiary" type="mono">
                {entry.count}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      {counted > cardCount ? (
        <ThemedText themeColor="textTertiary" type="body" style={styles.footnote}>
          A card playable at two speeds counts in both, so the shares can add past 100%.
        </ThemedText>
      ) : null}
    </Panel>
  );
}

export { SpeedMix };

const styles = StyleSheet.create({
  bar: {
    borderRadius: Radius.small - 1,
    flexDirection: "row",
    height: 10,
    marginTop: Spacing.three - 3,
    overflow: "hidden",
  },
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
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: 500,
  },
  note: {
    marginTop: Spacing.half,
  },
  figures: {
    alignItems: "flex-end",
  },
  footnote: {
    marginTop: Spacing.three - 2,
  },
});
