import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";

import { formatTaxonomyId } from "../../card-taxonomy-format";

/** The card's tags as outlined pills in its domain color. */
function CardKeywordRow({
  accent,
  tagIds,
}: {
  readonly accent: string;
  readonly tagIds: readonly string[];
}) {
  if (tagIds.length === 0) return null;

  return (
    <View style={styles.row}>
      {tagIds.map((tagId) => (
        <View key={tagId} style={[styles.keyword, { borderColor: accent }]}>
          <ThemedText style={{ color: accent }} type="small">
            {formatTaxonomyId(tagId)}
          </ThemedText>
        </View>
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
  keyword: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 1,
  },
});
