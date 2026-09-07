import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/catalog/card/card";

import { formatDomains, formatTaxonomyId } from "../../card-taxonomy-format";

function CardClassificationLine({
  accent,
  card,
}: {
  readonly accent: string;
  readonly card: Card;
}) {
  return (
    <View style={styles.line}>
      <ThemedText style={[styles.classification, { color: accent }]} type="mono">
        {formatDomains(card)} {formatTaxonomyId(card.classification.typeId)}
      </ThemedText>
      <ThemedText themeColor="textTertiary" type="mono">
        ·
      </ThemedText>
      <ThemedText themeColor="textSecondary" type="mono">
        {formatTaxonomyId(card.classification.rarityId)}
      </ThemedText>
    </View>
  );
}

export { CardClassificationLine };

const styles = StyleSheet.create({
  line: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.two - 1,
  },
  classification: {
    flexShrink: 1,
  },
});
