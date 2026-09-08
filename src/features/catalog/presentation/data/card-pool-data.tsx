import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { Card } from "@/features/catalog/card/card";
import type { CardListCriteria } from "@/features/catalog/card/card-list-criteria";
import type { CardLister } from "@/features/catalog/card/card-lister";

interface CardPoolDataProps {
  readonly cardLister: CardLister;
  readonly children: (cards: readonly Card[]) => ReactNode;
  readonly criteria: CardListCriteria;
}

type CardPoolDataState =
  | { readonly type: "loading" }
  | { readonly type: "loadFailed" }
  | { readonly type: "success"; readonly cards: readonly Card[] };

function CardPoolData({ cardLister, children, criteria }: CardPoolDataProps) {
  const [state, setState] = useState<CardPoolDataState>({ type: "loading" });
  const criteriaKey = JSON.stringify(criteria);

  useEffect(() => {
    const controller = new AbortController();
    void cardLister
      .getPage(JSON.parse(criteriaKey) as CardListCriteria, { signal: controller.signal })
      .then((page) => {
        if (!controller.signal.aborted) setState({ type: "success", cards: page.items });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ type: "loadFailed" });
      });

    return () => controller.abort();
  }, [cardLister, criteriaKey]);

  return match(state)
    .with({ type: "loading" }, () => (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    ))
    .with({ type: "loadFailed" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText type="body">Could not load cards.</ThemedText>
      </ThemedView>
    ))
    .with({ type: "success" }, ({ cards }) => children(cards))
    .exhaustive();
}

export { CardPoolData };

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.two,
    justifyContent: "center",
  },
});
