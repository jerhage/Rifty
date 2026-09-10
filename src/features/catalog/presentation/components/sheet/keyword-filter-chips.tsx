import { StyleSheet, View } from "react-native";

import { Chip } from "@/components/ui/atoms/chip";
import { ColorDot } from "@/components/ui/atoms/color-dot";
import { Spacing } from "@/constants/theme";
import type { Keyword } from "@/features/catalog/keyword/keyword";
import { useKeywordColors, useTheme } from "@/hooks/use-theme";

function KeywordFilterChips({
  keywords,
  onToggle,
  selectedIds,
}: {
  readonly keywords: readonly Keyword[];
  readonly onToggle: (keywordId: string) => void;
  readonly selectedIds: readonly string[];
}) {
  const theme = useTheme();
  const keywordColors = useKeywordColors();
  const colorFor = (id: string): string =>
    (keywordColors as Record<string, string | undefined>)[id] ?? theme.textSecondary;

  return (
    <View style={styles.chips}>
      {keywords.map((keyword) => (
        <Chip
          adornment={<ColorDot color={colorFor(keyword.id)} />}
          key={keyword.id}
          label={keyword.name}
          onPress={() => onToggle(keyword.id)}
          selected={selectedIds.includes(keyword.id)}
          tone="neutral"
        />
      ))}
    </View>
  );
}

export { KeywordFilterChips };

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two - 1,
  },
});
