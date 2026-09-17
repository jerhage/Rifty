import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import type { CardKeyword } from "@/features/card/card";
import { cardSpeedSchema } from "@/features/card/value-objects/card-speed";
import { useKeywordColor } from "@/hooks/use-theme";

import { DetailPill } from "./detail-pill";

const SPEED_KEYWORD_IDS: ReadonlySet<string> = new Set<string>(cardSpeedSchema.options);

function CardKeywordRow({ keywords }: { readonly keywords: readonly CardKeyword[] }) {
  const keywordColor = useKeywordColor();
  const shown = keywords.filter(
    (keyword, index) =>
      !SPEED_KEYWORD_IDS.has(keyword.id) &&
      keywords.findIndex((other) => other.id === keyword.id) === index,
  );

  if (shown.length === 0) return null;

  return (
    <View style={styles.row}>
      {shown.map((keyword) => (
        <DetailPill
          key={keyword.id}
          color={keywordColor(keyword.id)}
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
