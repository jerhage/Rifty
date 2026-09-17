import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import {
  SAVED_TITLE,
  savedSummaryLabel,
  type SavedCounts,
} from "@/components/app-shell/saved-format";
import { useTheme } from "@/hooks/use-theme";

interface SavedScreenProps {
  readonly counts: SavedCounts;
  readonly sections: ReactNode;
}

function SavedScreen({ counts, sections }: SavedScreenProps) {
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
        <ThemedText accessibilityRole="header" type="display">
          {SAVED_TITLE}
        </ThemedText>
        <ThemedText style={styles.summary} themeColor="textTertiary" type="mono">
          {savedSummaryLabel(counts)}
        </ThemedText>
      </View>
      <View
        style={[
          styles.body,
          {
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
          },
        ]}
      >
        {sections}
      </View>
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
    minHeight: 0,
    paddingTop: Spacing.three,
  },
});
