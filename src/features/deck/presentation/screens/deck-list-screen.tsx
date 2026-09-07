import { Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import type { Deck } from "@/features/deck/deck/deck";
import { useTheme } from "@/hooks/use-theme";

import { DeckRow } from "../components/deck-row";

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
          {summaryLabel(decks.length)}
        </ThemedText>

        {decks.map((deck) => (
          <DeckRow deck={deck} key={deck.id} now={now} onOpen={onOpenDeck} />
        ))}

        <NewDeckButton onPress={onNewDeck} />
      </ScrollView>
    </ThemedView>
  );
}

/** The dashed row doubles as the empty state, so an empty list still offers the one useful action. */
function NewDeckButton({ onPress }: { readonly onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel="Create a new deck"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.newDeck,
        { borderColor: theme.borderStrong },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText themeColor="textSecondary" type="body">
        + New deck
      </ThemedText>
    </Pressable>
  );
}

function summaryLabel(count: number): string {
  if (count === 0) return "No decks yet. Build your first list.";

  return count === 1 ? "1 list" : `${count} lists`;
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
  newDeck: {
    alignItems: "center",
    borderRadius: Radius.large,
    borderStyle: "dashed",
    borderWidth: 1,
    padding: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
