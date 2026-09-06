import { StyleSheet } from "react-native";

import type { Card } from "@/features/catalog/card/card";
import { Spacing } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

interface CardSummaryCardProps {
  readonly aspectRatio?: number;
  readonly card: Card;
}

function CardSummaryCard({ aspectRatio, card }: CardSummaryCardProps) {
  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.card, aspectRatio === undefined ? undefined : { aspectRatio }]}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="smallBold">{card.setCode}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          #{card.collectorNumber}
        </ThemedText>
      </ThemedView>

      <ThemedText type="subtitle" style={styles.name}>
        {card.name}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {formatClassification(card)}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Domains: {formatDomains(card.domainIds)}
      </ThemedText>

      <ThemedView style={styles.stats}>
        <Stat label="Cost" value={card.attributes.energy} />
        <Stat label="Power" value={card.attributes.power} />
        <Stat label="Might" value={card.attributes.might} />
      </ThemedView>

      <ThemedText type="smallBold">Abilities</ThemedText>
      <ThemedText style={styles.abilities}>{card.rulesText.plain || "No abilities."}</ThemedText>

    </ThemedView>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: number | null }) {
  return (
    <ThemedView type="backgroundSelected" style={styles.stat}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value ?? "—"}</ThemedText>
    </ThemedView>
  );
}

function formatClassification(card: Card): string {
  return [card.classification.supertypeId, card.classification.typeId, card.classification.rarityId]
    .filter((value): value is string => value !== null)
    .map((value) => value.replaceAll("-", " "))
    .map((value) => value.replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .join(" · ");
}

function formatDomains(domainIds: readonly string[]): string {
  return domainIds.length === 0
    ? "None"
    : domainIds
        .map((domainId) => domainId.replaceAll("-", " "))
        .map((domainId) => domainId.replace(/\b\w/g, (letter) => letter.toUpperCase()))
        .join(" · ");
}

export { CardSummaryCard };

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 24,
    lineHeight: 30,
  },
  stats: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  stat: {
    alignItems: "center",
    borderRadius: Spacing.two,
    flex: 1,
    gap: Spacing.half,
    padding: Spacing.two,
  },
  abilities: {
    lineHeight: 22,
  },
});
