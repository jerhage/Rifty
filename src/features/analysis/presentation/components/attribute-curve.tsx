import { StyleSheet, View } from "react-native";

import { Panel } from "@/components/ui/atoms/panel";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import type { CurveBucket } from "../../card-metrics";

function AttributeCurve({
  buckets,
  note,
  title,
}: {
  readonly buckets: readonly CurveBucket[];
  readonly note?: string;
  readonly title: string;
}) {
  const theme = useTheme();
  const highest = Math.max(1, ...buckets.map((bucket) => bucket.count));

  return (
    <Panel
      note={
        note === undefined ? undefined : (
          <ThemedText themeColor="textTertiary" type="mono">
            {note}
          </ThemedText>
        )
      }
      title={title}
    >
      <View style={styles.bars}>
        {buckets.map((bucket) => (
          <View
            accessible
            accessibilityLabel={bucketLabel(bucket)}
            key={bucket.label}
            style={styles.column}
          >
            <ThemedText themeColor="textSecondary" type="mono">
              {bucket.count}
            </ThemedText>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.track}
            >
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: theme.accent,
                    height: `${Math.max(4, (bucket.count / highest) * 100)}%`,
                  },
                ]}
              />
            </View>
            <ThemedText themeColor="textTertiary" type="mono">
              {bucket.label}
            </ThemedText>
          </View>
        ))}
      </View>
    </Panel>
  );
}

function bucketLabel(bucket: CurveBucket): string {
  const cards = bucket.count === 1 ? "1 card" : `${bucket.count} cards`;

  return `${bucket.label.replace("-", " to ")}, ${cards}`;
}

export { AttributeCurve };

const styles = StyleSheet.create({
  bars: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: Spacing.two + 1,
    marginTop: Spacing.three - 4,
    minHeight: 88,
  },
  column: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.one + 1,
  },
  track: {
    flex: 1,
    justifyContent: "flex-end",
    minHeight: 32,
    width: "100%",
  },
  bar: {
    borderRadius: Radius.small - 2,
    width: "100%",
  },
});
