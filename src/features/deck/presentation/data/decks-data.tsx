import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { match } from "ts-pattern";

import { Button } from "@/components/ui/atoms/button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type { Deck } from "@/features/deck/deck/deck";
import type { DeckLister } from "@/features/deck/deck/deck-lister";
import { listDecks, type ListDecksResult } from "@/features/deck/deck/use-cases/list-decks";
import { useAsyncResult } from "@/hooks/use-async-result";
import type { ReadOptions } from "@/shared/read-options";

interface DecksDataContent {
  readonly decks: readonly Deck[];
  reload(): void;
}

interface DecksDataProps {
  readonly children: (content: DecksDataContent) => ReactNode;
  readonly deckLister: DeckLister;
}

function DecksData({ children, deckLister }: DecksDataProps) {
  const { reload, result } = useAsyncResult<ListDecksResult>(
    (options: ReadOptions) => listDecks({ deckLister }, options),
    [deckLister],
  );

  return match(result)
    .with({ type: "loading" }, () => (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    ))
    .with({ type: "listFailed" }, () => (
      <ThemedView style={styles.centered}>
        <ThemedText type="body">Could not load your decks.</ThemedText>
        <Button label="Try again" onPress={reload} variant="secondary" />
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
