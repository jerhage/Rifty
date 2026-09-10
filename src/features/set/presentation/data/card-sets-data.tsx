import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { CardSet } from "@/features/set/card-set";
import type { SetLister } from "@/features/set/set-lister";

interface CardSetsDataProps {
  readonly children: (cardSets: readonly CardSet[]) => ReactNode;
  readonly setLister: SetLister;
}

type CardSetsDataState =
  | { readonly type: "loading" }
  | { readonly type: "loadFailed" }
  | { readonly type: "success"; readonly cardSets: readonly CardSet[] };

function CardSetsData({ children, setLister }: CardSetsDataProps) {
  const [state, setState] = useState<CardSetsDataState>({ type: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    void setLister
      .getAll({ signal: controller.signal })
      .then((cardSets) => {
        if (!controller.signal.aborted) setState({ type: "success", cardSets });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ type: "loadFailed" });
      });

    return () => controller.abort();
  }, [setLister]);

  return match(state)
    .with({ type: "loading" }, () => (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    ))
    .with({ type: "loadFailed" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText>Could not load card sets.</ThemedText>
      </ThemedView>
    ))
    .with({ type: "success" }, ({ cardSets }) => children(cardSets))
    .exhaustive();
}

export { CardSetsData };

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.two,
    justifyContent: "center",
  },
});
