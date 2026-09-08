import { type ReactNode, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/catalog/card/card";
import type { CardLister } from "@/features/catalog/card/card-lister";
import type { Deck, DeckId } from "@/features/deck/deck/deck";
import type { DeckFinder } from "@/features/deck/deck/deck-finder";
import { findDeck } from "@/features/deck/deck/use-cases/find-deck";

const CARD_LOOKUP_LIMIT = 100;

interface DeckDetailContent {
  readonly cards: readonly Card[];
  readonly deck: Deck;
  reload(): void;
}

type DeckDetailDataState =
  | { readonly type: "loading" }
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
  const [state, setState] = useState<DeckDetailDataState>({ type: "loading" });
  const [reloadCount, setReloadCount] = useState(0);
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<DeckDetailDataState> {
      const found = await findDeck(deckId, { deckFinder });

      return match(found)
        .with({ type: "notFound" }, () => ({ type: "notFound" }) as const)
        .with({ type: "loadFailed" }, () => ({ type: "loadFailed" }) as const)
        .with({ type: "success" }, async ({ deck }) => {
          const riftboundIds = [...new Set(deck.entries.map((entry) => entry.cardRiftboundId))];
          const page = riftboundIds.length
            ? await cardLister.getPage(
                { riftboundIds, limit: CARD_LOOKUP_LIMIT },
                { signal: controller.signal },
              )
            : null;

          return { type: "success", deck, cards: page?.items ?? [] } as const;
        })
        .exhaustive();
    }

    setState({ type: "loading" });
    void load()
      .then((next) => {
        if (!controller.signal.aborted) setState(next);
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ type: "loadFailed" });
      });

    return () => controller.abort();
  }, [cardLister, deckFinder, deckId, reloadCount]);

  return match(state)
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
