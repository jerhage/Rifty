import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/atoms/button";
import { EmptyState } from "@/components/ui/atoms/empty-state";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import type { DeckVerification } from "@/features/deck/deck/deck";
import type { ResolvedDeck } from "@/features/deck/deck/resolved-deck";
import { useTheme } from "@/hooks/use-theme";

import { DeckAnalysisPanels } from "../components/detail/deck-analysis-panels";
import { DeckSectionGroup } from "../components/detail/deck-section-group";
import { deckGroups } from "../deck-contents";
import { legalityColor, outstandingFixesLabel } from "../deck-legality-format";
import { deckCountLabel, editedLabel } from "../deck-summary-format";

interface DeckDetailScreenProps {
  readonly now: string;
  readonly onDrawSimulation: () => void;
  readonly onEdit: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly resolvedDeck: ResolvedDeck;
  readonly verification: DeckVerification;
}

function DeckDetailScreen({
  now,
  onDrawSimulation,
  onEdit,
  onOpenCard,
  resolvedDeck,
  verification,
}: DeckDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { deck, entries } = resolvedDeck;
  const groups = deckGroups(entries);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.page,
          {
            paddingBottom: insets.bottom + Spacing.five,
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
          },
        ]}
      >
        <View style={styles.titleRow}>
          <ThemedText accessibilityRole="header" style={styles.title} type="display">
            {deck.name}
          </ThemedText>
          <Button label="Edit" onPress={onEdit} variant="link" />
        </View>
        <View style={styles.metaRow}>
          <ThemedText style={styles.meta} themeColor="textTertiary" type="mono">
            {deckCountLabel(deck)} · {editedLabel(deck.updatedAt, now)}
          </ThemedText>
          <ThemedText
            style={[styles.meta, { color: legalityColor(verification, theme) }]}
            type="mono"
          >
            {outstandingFixesLabel(verification)}
          </ThemedText>
        </View>

        {deck.notes ? (
          <ThemedText themeColor="textSecondary" type="body" style={styles.notes}>
            {deck.notes}
          </ThemedText>
        ) : null}

        <View style={styles.drawSimulation}>
          <Button label="Draw sim" onPress={onDrawSimulation} variant="secondary" />
        </View>

        <DeckAnalysisPanels entries={entries} />

        {groups.map((group) => (
          <DeckSectionGroup group={group} key={group.title} onOpenCard={onOpenCard} />
        ))}

        {groups.length === 0 ? <EmptyState message="This deck has no cards yet." /> : null}
      </ScrollView>
    </ThemedView>
  );
}

export { DeckDetailScreen };
export type { DeckDetailScreenProps };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  page: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: MaxContentWidth,
    paddingTop: Spacing.three,
    width: "100%",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
    justifyContent: "space-between",
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
  },
  metaRow: {
    alignItems: "baseline",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two + 2,
    justifyContent: "space-between",
    marginTop: Spacing.two - 1,
  },
  meta: {
    flexShrink: 1,
  },
  notes: {
    marginTop: Spacing.two + 1,
  },
  drawSimulation: {
    alignItems: "flex-start",
    marginTop: Spacing.three,
  },
});
