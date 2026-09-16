import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxReadingWidth, Spacing } from "@/constants/theme";
import { SAVED_TITLE, savedSummaryLabel } from "@/components/app-shell/saved-format";
import { useTheme } from "@/hooks/use-theme";

interface SavedScreenProps {
  readonly notes: ReactNode;
  readonly scratchpad: ReactNode;
  readonly scratchpadNoteCount: number;
}

function SavedScreen({ notes, scratchpad, scratchpadNoteCount }: SavedScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView style={styles.screen}>
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.border,
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
            paddingTop: insets.top + Spacing.four,
          },
        ]}
      >
        <View style={styles.column}>
          <ThemedText accessibilityRole="header" type="display">
            {SAVED_TITLE}
          </ThemedText>
          <ThemedText style={styles.summary} themeColor="textTertiary" type="mono">
            {savedSummaryLabel(scratchpadNoteCount)}
          </ThemedText>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.page,
          {
            paddingBottom: insets.bottom + Spacing.five,
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
          },
        ]}
        style={styles.body}
      >
        <View style={[styles.column, styles.stack]}>
          {scratchpad}
          {notes}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

export { SavedScreen };
export type { SavedScreenProps };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
    flexShrink: 0,
    paddingBottom: Spacing.two + 2,
  },
  summary: {
    marginTop: Spacing.one + 1,
  },
  body: {
    flex: 1,
  },
  page: {
    flexGrow: 1,
    paddingTop: Spacing.three,
  },
  stack: {
    gap: Spacing.five,
  },
  column: {
    alignSelf: "center",
    maxWidth: MaxReadingWidth,
    minWidth: 0,
    width: "100%",
  },
});
