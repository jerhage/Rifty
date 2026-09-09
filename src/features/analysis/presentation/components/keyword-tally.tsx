import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useKeywordColors, useTheme } from "@/hooks/use-theme";

import type { KeywordMix } from "../../card-metrics";

function KeywordTally({
  cardCount,
  mix,
}: {
  readonly cardCount: number;
  readonly mix: KeywordMix;
}) {
  const theme = useTheme();
  const keywordColors = useKeywordColors();
  const { carrying, keywords } = mix;
  const colorFor = (id: string): string =>
    (keywordColors as Record<string, string | undefined>)[id] ?? theme.textSecondary;
  const highest = Math.max(1, ...keywords.map((keyword) => keyword.count));

  if (keywords.length === 0) return null;

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <View style={styles.header}>
        <ThemedText themeColor="textTertiary" type="mono">
          Keywords
        </ThemedText>
        <ThemedText themeColor="textTertiary" type="mono">
          {`${carrying} of ${cardCount} carry a keyword`}
        </ThemedText>
      </View>
      {keywords.map((keyword) => (
        <View key={keyword.id} style={styles.row}>
          <ThemedText
            numberOfLines={1}
            style={[styles.name, { color: colorFor(keyword.id) }]}
            type="body"
          >
            {keyword.name}
          </ThemedText>
          <View style={[styles.track, { backgroundColor: theme.fill }]}>
            <View
              style={[
                styles.bar,
                {
                  backgroundColor: colorFor(keyword.id),
                  width: `${(keyword.count / highest) * 100}%`,
                },
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
  header: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: Spacing.two,
    justifyContent: "space-between",
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
