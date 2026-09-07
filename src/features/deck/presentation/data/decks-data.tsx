import { type ReactNode, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { SecondaryButton } from "@/components/ui/atoms/secondary-button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { Deck } from "@/features/deck/deck/deck";
import type { DeckLister } from "@/features/deck/deck/deck-lister";

interface DecksDataContent {
  readonly decks: readonly Deck[];
  reload(): void;
}

interface DecksDataProps {
  readonly children: (content: DecksDataContent) => ReactNode;
  readonly deckLister: DeckLister;
}

type DecksDataState =
  | { readonly type: "loading" }
  | { readonly type: "loadFailed" }
  | { readonly type: "success"; readonly decks: readonly Deck[] };

function DecksData({ children, deckLister }: DecksDataProps) {
  const [state, setState] = useState<DecksDataState>({ type: "loading" });
  const [reloadCount, setReloadCount] = useState(0);
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    void deckLister
      .getAll({ signal: controller.signal })
      .then((decks) => {
        if (!controller.signal.aborted) setState({ type: "success", decks });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ type: "loadFailed" });
      });

    return () => controller.abort();
  }, [deckLister, reloadCount]);

  return match(state)
    .with({ type: "loading" }, () => (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    ))
    .with({ type: "loadFailed" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText type="body">Could not load your decks.</ThemedText>
        <SecondaryButton label="Try again" onPress={reload} />
      </ThemedView>
    ))
    .with({ type: "success" }, ({ decks }) => children({ decks, reload }))
    .exhaustive();
}

export { DecksData };
export type { DecksDataContent };

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.three,
    justifyContent: "center",
  },
});
