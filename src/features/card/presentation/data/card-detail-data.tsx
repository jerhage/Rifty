import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import type { Card } from "@/features/card/card";
import type { CardFinder } from "@/features/card/card-finder";
import { findCard, type FindCardResult } from "@/features/card/use-cases/find-card";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import { type AsyncResult, useAsyncResult } from "@/hooks/use-async-result";
import type { ReadOptions } from "@/shared/read-options";

type CardDetailDataContent = AsyncResult<FindCardResult>;

interface CardDetailDataProps {
  readonly cardFinder: CardFinder;
  readonly cardId: PrintingId;
  readonly children: (card: Card) => ReactNode;
}

function CardDetailData({ cardFinder, cardId, children }: CardDetailDataProps) {
  const { result } = useAsyncResult<FindCardResult>(
    (options: ReadOptions) => findCard(cardId, { cardFinder }, options),
    [cardFinder, cardId],
  );

  return match(result)
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
