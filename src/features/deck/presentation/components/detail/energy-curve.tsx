import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function EnergyCurve({
  buckets,
}: {
  readonly buckets: readonly { label: string; count: number }[];
}) {
  const theme = useTheme();
  const highest = Math.max(1, ...buckets.map((bucket) => bucket.count));

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <ThemedText themeColor="textTertiary" type="mono">
        Energy curve
      </ThemedText>
      <View style={styles.bars}>
        {buckets.map((bucket) => (
          <View key={bucket.label} style={styles.column}>
            <ThemedText themeColor="textSecondary" type="mono">
              {bucket.count}
            </ThemedText>
            <View style={styles.track}>
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
    </View>
  );
}

export { EnergyCurve };

const styles = StyleSheet.create({
  panel: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three - 4,
    padding: Spacing.three - 2,
  },
  bars: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: Spacing.two + 1,
    height: 88,
  },
  column: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.one + 1,
    height: "100%",
  },
  track: {
    flex: 1,
    justifyContent: "flex-end",
    minHeight: 0,
    width: "100%",
  },
  bar: {
    borderRadius: Radius.small - 2,
    width: "100%",
  },
});
