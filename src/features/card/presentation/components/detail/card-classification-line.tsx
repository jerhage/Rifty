import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";

import { cardDomainNames, formatDomains } from "../../card-taxonomy-format";

function CardClassificationLine({
  accent,
  card,
}: {
  readonly accent: string;
  readonly card: Card;
}) {
  return (
    <View accessible accessibilityLabel={classificationLabel(card)} style={styles.line}>
      <ThemedText style={[styles.classification, { color: accent }]} type="mono">
        {formatDomains(card.domainIds)} {card.classification.typeId}
      </ThemedText>
      <ThemedText themeColor="textTertiary" type="mono">
        ·
      </ThemedText>
      <ThemedText themeColor="textSecondary" type="mono">
        {card.classification.rarity.name}
      </ThemedText>
    </View>
  );
}

function classificationLabel(card: Card): string {
  return [
    ...cardDomainNames(card.domainIds),
    card.classification.typeId,
    card.classification.rarity.name,
  ].join(", ");
}

export { CardClassificationLine };

const styles = StyleSheet.create({
  line: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.two - 1,
  },
  classification: {
    flexShrink: 1,
  },
});
