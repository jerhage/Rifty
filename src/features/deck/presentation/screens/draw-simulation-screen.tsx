import { useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import type { RandomSource } from "@/application/ports/random-source";
import { MULLIGAN_LIMIT, drawOdds, handStats } from "@/features/analysis/draw-simulation";
import { DrawOddsPanel } from "@/features/analysis/presentation/components/draw-odds";
import { HandStatsPanel } from "@/features/analysis/presentation/components/hand-stats";
import type { Card } from "@/features/catalog/card/card";
import type { Deck } from "@/features/deck/deck/deck";
import { useTheme } from "@/hooks/use-theme";
import { shuffle } from "@/shared/shuffle";

import { HandCardTile } from "../components/draw/hand-card-tile";
import { MAIN_DECK_SECTIONS, chosenChampionCard, deckCards } from "../deck-contents";
import { useDrawSimulation } from "../hooks/use-draw-simulation";

interface DrawSimulationScreenProps {
  readonly cards: readonly Card[];
  readonly deck: Deck;
  readonly onBack: () => void;
  readonly onKeep: () => void;
  readonly randomSource: RandomSource;
}

function DrawSimulationScreen({
  cards,
  deck,
  onBack,
  onKeep,
  randomSource,
}: DrawSimulationScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const copies = useMemo(() => deckCards(deck, cards, MAIN_DECK_SECTIONS), [cards, deck]);
  const odds = useMemo(
    () => drawOdds(copies, chosenChampionCard(deck, cards)),
    [cards, copies, deck],
  );
  const shuffleCards = useCallback(
    <Item,>(items: readonly Item[]): readonly Item[] => shuffle(items, () => randomSource.next()),
    [randomSource],
  );
  const {
    hand,
    handNumber,
    mulligan,
    notice,
    selected,
    dealFreshHand,
    takeMulligan,
    toggleSelection,
  } = useDrawSimulation(copies, shuffleCards);

  const handLabel = match(mulligan)
    .with(
      { type: "spent" },
      (spent) => `Opening hand · Hand ${handNumber} · Mulliganed ${spent.replaced}`,
    )
    .with({ type: "available" }, () => `Opening hand · Hand ${handNumber}`)
    .exhaustive();

  const limitMessage = match(notice)
    .with({ type: "none" }, () => null)
    .with(
      { type: "selectionLimit" },
      () => "Two is the mulligan limit. Tap a chosen card again to deselect it.",
    )
    .with({ type: "mulliganSpent" }, () => "One mulligan per game — this hand is set.")
    .exhaustive();

  const statusNote = match(mulligan)
    .with({ type: "spent" }, (spent) =>
      spent.replaced === 0
        ? "The deck ran out before the redraw. No second mulligan."
        : `You mulliganed ${spent.replaced}. No second mulligan.`,
    )
    .with({ type: "available" }, () =>
      selected.length === 0 ? "Tap up to two cards to mulligan" : `Redraws ${selected.length}`,
    )
    .exhaustive();

  const statusCounter = match(mulligan)
    .with({ type: "spent" }, () => "0 left")
    .with(
      { type: "available" },
      () => `${MULLIGAN_LIMIT - selected.length} of ${MULLIGAN_LIMIT} left`,
    )
    .exhaustive();

  const mulliganLabel = match(mulligan)
    .with({ type: "spent" }, () => "Mulligan spent")
    .with({ type: "available" }, () =>
      selected.length === 0 ? "Mulligan" : `Mulligan ${selected.length}`,
    )
    .exhaustive();

  const mulliganDisabled = match(mulligan)
    .with({ type: "spent" }, () => true)
    .with({ type: "available" }, () => selected.length === 0)
    .exhaustive();

  return (
    <ThemedView style={styles.screen}>
      <View
        style={[
          styles.header,
          {
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
            paddingTop: insets.top + Spacing.two,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.back,
            { backgroundColor: theme.fill },
            pressed && styles.pressed,
          ]}
        >
          <ThemedText type="small">←</ThemedText>
        </Pressable>
        <ThemedText themeColor="textSecondary" type="mono">
          {handLabel}
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.page,
          {
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
          },
        ]}
      >
        <ThemedText type="display">Would you keep it?</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle} type="body">
          {`Four off the top of ${odds.poolSize}. You may mulligan up to two and redraw them — once.`}
        </ThemedText>

        <View style={styles.hand}>
          {hand.map((card, index) => (
            <HandCardTile
              card={card}
              key={`${card.riftboundId}-${index}`}
              onToggleSelection={() => toggleSelection(index)}
              selected={selected.includes(index)}
            />
          ))}
        </View>

        {hand.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.empty} type="body">
            The main deck has no cards to draw from yet.
          </ThemedText>
        ) : null}

        <View style={[styles.status, { backgroundColor: theme.fill, borderColor: theme.border }]}>
          <ThemedText
            style={styles.statusNote}
            themeColor={limitMessage === null ? "textSecondary" : "warning"}
            type="body"
          >
            {limitMessage ?? statusNote}
          </ThemedText>
          <ThemedText themeColor="textTertiary" type="mono">
            {statusCounter}
          </ThemedText>
        </View>

        <View style={styles.panels}>
          <HandStatsPanel stats={handStats(hand)} />
          <DrawOddsPanel odds={odds} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + Spacing.three,
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
          },
        ]}
      >
        <View style={styles.primary}>
          <Button
            disabled={mulliganDisabled}
            label={mulliganLabel}
            onPress={takeMulligan}
            variant="primary"
          />
        </View>
        <Button label="Keep" onPress={onKeep} variant="secondary" />
        <Button label="New" onPress={dealFreshHand} variant="secondary" />
      </View>
    </ThemedView>
  );
}

export { DrawSimulationScreen };
export type { DrawSimulationScreenProps };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: Spacing.three - 4,
    maxWidth: MaxContentWidth,
    paddingBottom: Spacing.two + 2,
    width: "100%",
  },
  back: {
    alignItems: "center",
    borderRadius: Radius.medium,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  page: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: MaxContentWidth,
    paddingBottom: Spacing.five,
    width: "100%",
  },
  subtitle: {
    marginTop: Spacing.one,
  },
  hand: {
    flexDirection: "row",
    gap: Spacing.two - 1,
    marginTop: Spacing.three + 2,
  },
  empty: {
    marginTop: Spacing.three,
  },
  status: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two + 2,
    justifyContent: "space-between",
    marginTop: Spacing.three - 5,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two + 2,
  },
  statusNote: {
    flex: 1,
    minWidth: 0,
  },
  panels: {
    gap: Spacing.two + 2,
    marginTop: Spacing.four,
  },
  footer: {
    alignItems: "center",
    alignSelf: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two + 2,
    maxWidth: MaxContentWidth,
    paddingTop: Spacing.three - 4,
    width: "100%",
  },
  primary: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
