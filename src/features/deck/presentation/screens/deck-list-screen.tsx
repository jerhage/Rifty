import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import type { Deck } from "@/features/deck/deck/deck";

import { DeckRow } from "../components/deck-row";
import { NewDeckButton } from "../components/new-deck-button";
import { deckListLabel } from "../deck-summary-format";

interface DeckListScreenProps {
  readonly decks: readonly Deck[];
  readonly now: string;
  readonly onNewDeck: () => void;
  readonly onOpenDeck: (id: string) => void;
}

function DeckListScreen({ decks, now, onNewDeck, onOpenDeck }: DeckListScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.page,
          {
            paddingBottom: insets.bottom + Spacing.five,
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
            paddingTop: insets.top + Spacing.four,
          },
        ]}
      >
        <ThemedText type="display">Decks</ThemedText>
        <ThemedText themeColor="textSecondary" type="body" style={styles.subtitle}>
          {deckListLabel(decks.length)}
        </ThemedText>

        {decks.map((deck) => (
          <DeckRow deck={deck} key={deck.id} now={now} onOpen={onOpenDeck} />
        ))}

        <NewDeckButton onPress={onNewDeck} />
      </ScrollView>
    </ThemedView>
  );
}

export { DeckListScreen };
export type { DeckListScreenProps };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  page: {
    alignSelf: "center",
    flexGrow: 1,
    gap: Spacing.three - 5,
    maxWidth: MaxContentWidth,
    width: "100%",
  },
  subtitle: {
    marginBottom: Spacing.three - 3,
  },
});
