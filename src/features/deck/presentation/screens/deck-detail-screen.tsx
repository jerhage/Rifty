import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import {
  abilityCardCount,
  energyCurve,
  keywordMix,
  speedMix,
} from "@/features/analysis/card-metrics";
import { AttributeCurve } from "@/features/analysis/presentation/components/attribute-curve";
import { KeywordTally } from "@/features/analysis/presentation/components/keyword-tally";
import { SpeedMix } from "@/features/analysis/presentation/components/speed-mix";
import type { Card } from "@/features/card/card";
import type { Deck, DeckVerification } from "@/features/deck/deck/deck";
import { useTheme } from "@/hooks/use-theme";

import { DeckCardRow } from "../components/detail/deck-card-row";
import { MAIN_DECK_SECTIONS, MAIN_DECK_WITH_LEGEND, deckCards, deckGroups } from "../deck-contents";
import { deckCountLabel, editedLabel } from "../deck-summary-format";

interface DeckDetailScreenProps {
  readonly cards: readonly Card[];
  readonly deck: Deck;
  readonly now: string;
  readonly onDrawSimulation: () => void;
  readonly onEdit: () => void;
  readonly onOpenCard: (card: Card) => void;
  readonly verification: DeckVerification;
}

function DeckDetailScreen({
  cards,
  deck,
  now,
  onDrawSimulation,
  onEdit,
  onOpenCard,
  verification,
}: DeckDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const groups = deckGroups(deck, cards);
  const mainDeckCopies = deckCards(deck, cards, MAIN_DECK_SECTIONS);
  const abilityCopies = deckCards(deck, cards, MAIN_DECK_WITH_LEGEND);
  const abilityCards = abilityCardCount(abilityCopies);

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
          <ThemedText style={styles.title} type="display">
            {deck.name}
          </ThemedText>
          <Button label="Edit" onPress={onEdit} variant="link" />
        </View>
        <View style={styles.metaRow}>
          <ThemedText themeColor="textTertiary" type="mono">
            {deckCountLabel(deck)} · {editedLabel(deck.updatedAt, now)}
          </ThemedText>
          <ThemedText
            style={{ color: verification.type === "legal" ? theme.positive : theme.warning }}
            type="mono"
          >
            {legalityLabel(verification)}
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

        <View style={styles.panels}>
          <AttributeCurve buckets={energyCurve(mainDeckCopies)} title="Energy curve" />
          <SpeedMix cardCount={abilityCards} speeds={speedMix(abilityCopies)} />
          <KeywordTally cardCount={abilityCards} mix={keywordMix(abilityCopies)} />
        </View>

        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <View style={styles.groupHeader}>
              <ThemedText type="heading">{group.title}</ThemedText>
              <ThemedText themeColor="textTertiary" type="mono">
                {group.count}
              </ThemedText>
            </View>
            {group.cards.map((held) => (
              <DeckCardRow
                card={held.card}
                key={held.card.printingId}
                onOpenCard={onOpenCard}
                quantity={held.quantity}
              />
            ))}
          </View>
        ))}

        {groups.length === 0 ? (
          <ThemedText themeColor="textSecondary" type="body" style={styles.empty}>
            This deck has no cards yet.
          </ThemedText>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function legalityLabel(verification: DeckVerification): string {
  return match(verification)
    .with({ type: "legal" }, () => "Legal")
    .with({ type: "unverified" }, () => "Not checked")
    .with({ type: "illegal" }, ({ violations }) => `${violations.length} to fix`)
    .exhaustive();
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
    gap: Spacing.three,
    justifyContent: "space-between",
  },
  title: {
    flexShrink: 1,
  },
  metaRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: Spacing.two + 2,
    justifyContent: "space-between",
    marginTop: Spacing.two - 1,
  },
  notes: {
    marginTop: Spacing.two + 1,
  },
  drawSimulation: {
    alignItems: "flex-start",
    marginTop: Spacing.three,
  },
  panels: {
    gap: Spacing.two + 2,
    marginTop: Spacing.three,
  },
  group: {
    gap: Spacing.two - 1,
    marginTop: Spacing.four,
  },
  groupHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.one,
  },
  empty: {
    paddingVertical: Spacing.six,
    textAlign: "center",
  },
});
