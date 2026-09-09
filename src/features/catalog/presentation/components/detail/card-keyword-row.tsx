import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import type { CardKeyword } from "@/features/catalog/card/card";
import { cardSpeedSchema } from "@/features/catalog/value-objects/card-speed";
import { useKeywordColors, useTheme } from "@/hooks/use-theme";

import { DetailPill } from "./detail-pill";

const SPEED_KEYWORD_IDS: ReadonlySet<string> = new Set<string>(cardSpeedSchema.options);

function CardKeywordRow({ keywords }: { readonly keywords: readonly CardKeyword[] }) {
  const theme = useTheme();
  const keywordColors = useKeywordColors();
  const colorFor = (id: string): string =>
    (keywordColors as Record<string, string | undefined>)[id] ?? theme.textSecondary;
  const shown = keywords.filter((keyword) => !SPEED_KEYWORD_IDS.has(keyword.id));

  if (shown.length === 0) return null;

  return (
    <View style={styles.row}>
      {shown.map((keyword) => (
        <DetailPill
          key={keyword.id}
          color={colorFor(keyword.id)}
          label={keyword.value === null ? keyword.name : `${keyword.name} ${keyword.value}`}
        />
      ))}
    </View>
  );
}

export { CardKeywordRow };

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two - 1,
    marginTop: Spacing.three - 5,
  },
});
