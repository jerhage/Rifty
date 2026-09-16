import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxReadingWidth, Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import {
  coreRulesCountLabel,
  coreRulesEditionLabel,
} from "@/features/rules/presentation/core-rules-format";
import { useTheme } from "@/hooks/use-theme";

interface CoreRulesHeaderProps {
  readonly coreRules: readonly CoreRule[];
  readonly edition: CoreRulesEdition;
}

/** Names the edition on screen and stays put, so the document scrolls beneath rather than past it. */
function CoreRulesHeader({ coreRules, edition }: CoreRulesHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView style={[styles.header, { borderBottomColor: theme.border }]}>
      <View
        style={[
          styles.column,
          {
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
            paddingTop: insets.top + Spacing.four,
          },
        ]}
      >
        <ThemedText accessibilityRole="header" type="display">
          {edition.title}
        </ThemedText>
        <ThemedText themeColor="textSecondary" type="mono">
          {coreRulesEditionLabel(edition)}
        </ThemedText>
        <ThemedText style={styles.counts} themeColor="textTertiary" type="mono">
          {coreRulesCountLabel(coreRules)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

export { CoreRulesHeader };
export type { CoreRulesHeaderProps };

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  column: {
    alignSelf: "center",
    gap: Spacing.two - 3,
    maxWidth: MaxReadingWidth,
    paddingBottom: Spacing.three,
    width: "100%",
  },
  counts: {
    marginTop: Spacing.two - 1,
  },
});
