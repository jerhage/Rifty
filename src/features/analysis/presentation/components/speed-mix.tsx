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
  const present = speeds.filter((share) => share.count > 0);
  const counted = present.reduce((total, share) => total + share.count, 0);

  return (
    <Panel
      note={
        <ThemedText themeColor="textSecondary" type="mono">
          {cardCount === 1 ? "1 card" : `${cardCount} cards`}
        </ThemedText>
      }
      title="Speed mix"
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.bar, { backgroundColor: theme.fill }]}
      >
        {present.map((share) => (
          <View
            key={share.speed}
            style={{
              backgroundColor: speedColors[share.speed],
              flexGrow: share.count,
              height: "100%",
            }}
          />
        ))}
      </View>

      <View style={styles.rows}>
        {speeds.map((share) => (
          <View
            accessible
            accessibilityLabel={speedLabel(share)}
            key={share.speed}
            style={styles.row}
          >
            <ColorDot color={speedColors[share.speed]} shape="diamond" size={9} />
            <View style={styles.label}>
              <ThemedText type="body" style={styles.name}>
                {cardSpeedName(share.speed)}
              </ThemedText>
              <ThemedText
                numberOfLines={1}
                themeColor="textTertiary"
                type="body"
                style={styles.note}
              >
                {speedNote(share.speed)}
              </ThemedText>
            </View>
            <View style={styles.figures}>
              <ThemedText style={{ color: speedColors[share.speed] }} type="monoValue">
                {`${Math.round(share.share * 100)}%`}
              </ThemedText>
              <ThemedText themeColor="textTertiary" type="mono">
                {share.count}
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

function speedLabel(share: SpeedShare): string {
  const cards = share.count === 1 ? "1 card" : `${share.count} cards`;

  return `${cardSpeedName(share.speed)}, ${speedNote(share.speed)}, ${Math.round(share.share * 100)}%, ${cards}`;
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
