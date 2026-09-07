import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { ZoneRule } from "@/features/deck/deck/deck-legality";
import { useTheme } from "@/hooks/use-theme";

function ZoneProgressRow({ count, rule }: { readonly count: number; readonly rule: ZoneRule }) {
  const theme = useTheme();
  const isComplete = count === rule.requiredCount;
  const barColor = isComplete ? theme.positive : theme.accent;

  return (
    <View
      style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
    >
      <View style={styles.header}>
        <ThemedText type="small">{rule.label}</ThemedText>
        <ThemedText
          style={{ color: isComplete ? theme.positive : theme.textSecondary }}
          type="mono"
        >
          {count} / {rule.requiredCount}
        </ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.fill }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              width: `${Math.min(100, (count / rule.requiredCount) * 100)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

export { ZoneProgressRow };

const styles = StyleSheet.create({
  row: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two + 1,
    padding: Spacing.three - 4,
  },
  header: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  track: {
    borderRadius: 3,
    height: 6,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
