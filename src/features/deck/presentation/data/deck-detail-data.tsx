import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import type { CardLister } from "@/features/card/card-lister";
import type { Deck, DeckId } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";
import { findDeck } from "@/features/deck/deck/use-cases/find-deck";
import { useAsyncResult } from "@/hooks/use-async-result";
import { type ReadOptions, throwIfAborted } from "@/shared/read-options";

const CARD_LOOKUP_LIMIT = 100;

interface DeckDetailContent {
  readonly cards: readonly Card[];
  readonly deck: Deck;
  reload(): void;
}

type DeckDetailOutcome =
  | { readonly type: "notFound" }
  | { readonly type: "loadFailed" }
  | { readonly type: "success"; readonly deck: Deck; readonly cards: readonly Card[] };

function DeckDetailData({
  cardLister,
  children,
  deckFinder,
  deckId,
}: {
  readonly cardLister: CardLister;
  readonly children: (content: DeckDetailContent) => ReactNode;
  readonly deckFinder: DeckFinder;
  readonly deckId: DeckId;
}) {
  const { reload, result } = useAsyncResult<DeckDetailOutcome>(
    async (options: ReadOptions) => {
      const found = await findDeck(deckId, { deckFinder }, options);

      return match(found)
        .with({ type: "notFound" }, () => ({ type: "notFound" }) as const)
        .with({ type: "loadFailed" }, () => ({ type: "loadFailed" }) as const)
        .with({ type: "success" }, async ({ deck }) => {
          const printingIds = [...new Set(deck.entries.map((entry) => entry.printingId))];
          if (!printingIds.length) return { type: "success", deck, cards: [] } as const;

          try {
            const page = await cardLister.getPage(
              { printingIds, limit: CARD_LOOKUP_LIMIT },
              options,
            );
            return { type: "success", deck, cards: page.items } as const;
          } catch {
            throwIfAborted(options.signal);
            return { type: "loadFailed" } as const;
          }
        })
        .exhaustive();
    },
    [cardLister, deckFinder, deckId],
  );

  return match(result)
    .with({ type: "loading" }, () => (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    ))
    .with({ type: "notFound" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText type="body">That deck no longer exists.</ThemedText>
      </ThemedView>
    ))
    .with({ type: "loadFailed" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText type="body">Could not load the deck.</ThemedText>
        <Button label="Try again" onPress={reload} variant="secondary" />
      </ThemedView>
    ))
    .with({ type: "success" }, ({ cards, deck }) => children({ cards, deck, reload }))
    .exhaustive();
}

export { DeckDetailData };
export type { DeckDetailContent };

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.three,
    justifyContent: "center",
  },
});
