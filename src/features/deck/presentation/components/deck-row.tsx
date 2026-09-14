import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Deck } from "@/features/deck/deck/deck";
import { useTheme } from "@/hooks/use-theme";

import {
  deckCountLabel,
  deckCountParts,
  editedLabel,
  spokenEditedLabel,
} from "../deck-label-format";

function DeckRow({
  deck,
  now,
  onOpen,
}: {
  readonly deck: Deck;
  readonly now: string;
  readonly onOpen: (deck: Deck) => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={deckLabel(deck, now)}
      accessibilityRole="button"
      onPress={() => onOpen(deck)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.text}>
        <ThemedText numberOfLines={1} type="heading">
          {deck.name}
        </ThemedText>
        <ThemedText themeColor="textTertiary" type="mono" style={styles.meta}>
          {deckCountLabel(deck)} · {editedLabel(deck.updatedAt, now)}
        </ThemedText>
        {deck.notes ? (
          <ThemedText numberOfLines={2} themeColor="textSecondary" type="body" style={styles.notes}>
            {deck.notes}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

function deckLabel(deck: Deck, now: string): string {
  return [deck.name, ...deckCountParts(deck), spokenEditedLabel(deck.updatedAt, now)].join(", ");
}

export { DeckRow };

const styles = StyleSheet.create({
  row: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.three - 3,
    padding: Spacing.three - 2,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    marginTop: Spacing.one + 1,
  },
  notes: {
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
