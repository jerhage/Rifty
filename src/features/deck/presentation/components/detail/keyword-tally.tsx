import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function KeywordTally({
  keywords,
}: {
  readonly keywords: readonly { name: string; count: number }[];
}) {
  const theme = useTheme();
  const highest = Math.max(1, ...keywords.map((keyword) => keyword.count));

  if (keywords.length === 0) return null;

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <ThemedText themeColor="textTertiary" type="mono">
        Keywords
      </ThemedText>
      {keywords.map((keyword) => (
        <View key={keyword.name} style={styles.row}>
          <ThemedText numberOfLines={1} style={styles.name} type="body">
            {keyword.name}
          </ThemedText>
          <View style={[styles.track, { backgroundColor: theme.fill }]}>
            <View
              style={[
                styles.bar,
                { backgroundColor: theme.accent, width: `${(keyword.count / highest) * 100}%` },
              ]}
            />
          </View>
          <ThemedText themeColor="textSecondary" style={styles.count} type="mono">
            {keyword.count}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

export { KeywordTally };

const styles = StyleSheet.create({
  panel: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two + 1,
    padding: Spacing.three - 2,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two + 2,
  },
  name: {
    flexBasis: 108,
    flexShrink: 0,
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
  count: {
    textAlign: "right",
    width: 22,
  },
});
