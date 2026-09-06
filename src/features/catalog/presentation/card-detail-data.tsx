import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import type { Card, CardId } from "@/features/catalog/card/card";
import type { CardFinder } from "@/features/catalog/card/card-finder";

type CardDetailDataContent =
  | { readonly type: "loading" }
  | { readonly type: "notFound" }
  | { readonly type: "loadFailed" }
  | { readonly type: "success"; readonly card: Card };

interface CardDetailDataProps {
  readonly cardFinder: CardFinder;
  readonly cardId: CardId;
  readonly children: (card: Card) => ReactNode;
}

function CardDetailData({ cardFinder, cardId, children }: CardDetailDataProps) {
  const [state, setState] = useState<CardDetailDataContent>({ type: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ type: "loading" });
    void cardFinder
      .get(cardId, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setState(result ? { type: "success", card: result } : { type: "notFound" });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ type: "loadFailed" });
      });

    return () => {
      controller.abort();
    };
  }, [cardFinder, cardId]);

  return match(state)
    .with({ type: "loading" }, () => (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    ))
    .with({ type: "notFound" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText>Card not found.</ThemedText>
      </ThemedView>
    ))
    .with({ type: "loadFailed" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText>Could not load this card.</ThemedText>
      </ThemedView>
    ))
    .with({ type: "success" }, ({ card }) => children(card))
    .exhaustive();
}

export { CardDetailData };
export type { CardDetailDataContent, CardDetailDataProps };

const styles = StyleSheet.create({
  centered: { alignItems: "center", flex: 1, justifyContent: "center" },
});
