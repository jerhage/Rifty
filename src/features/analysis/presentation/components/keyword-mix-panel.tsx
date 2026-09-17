import { StyleSheet, View } from "react-native";

import { Panel } from "@/components/ui/atoms/panel";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import { useKeywordColor, useTheme } from "@/hooks/use-theme";

import type { KeywordMix, KeywordShare } from "../../card-metrics";

function KeywordMixPanel({
  cardCount,
  mix,
}: {
  readonly cardCount: number;
  readonly mix: KeywordMix;
}) {
  const theme = useTheme();
  const keywordColor = useKeywordColor();
  const { carrying, keywords } = mix;
  const highest = Math.max(1, ...keywords.map((keyword) => keyword.count));

  if (keywords.length === 0) return null;

  return (
    <Panel
      note={
        <ThemedText themeColor="textTertiary" type="mono">
          {`${carrying} of ${cardCount} carry a keyword`}
        </ThemedText>
      }
      title="Keywords"
    >
      <View style={styles.rows}>
        {keywords.map((keyword) => (
          <View
            accessible
            accessibilityLabel={keywordLabel(keyword)}
            key={keyword.id}
            style={styles.row}
          >
            <ThemedText style={[styles.name, { color: keywordColor(keyword.id) }]} type="body">
              {keyword.name}
            </ThemedText>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.track, { backgroundColor: theme.fill }]}
            >
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: keywordColor(keyword.id),
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
    </Panel>
  );
}

function keywordLabel(keyword: KeywordShare): string {
  return `${keyword.name}, ${keyword.count === 1 ? "1 card" : `${keyword.count} cards`}`;
}

export { KeywordMixPanel };

const styles = StyleSheet.create({
  rows: {
    gap: Spacing.two + 1,
    marginTop: Spacing.two + 1,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two + 2,
  },
  name: {
    flexShrink: 1,
    minWidth: 108,
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
  count: {
    minWidth: 22,
    textAlign: "right",
  },
});
