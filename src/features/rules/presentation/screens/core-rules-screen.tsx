import { FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxReadingWidth, Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import { useTheme } from "@/hooks/use-theme";

import { CoreRuleRow } from "../components/core-rule-row";
import { CoreRulesHeader } from "../components/core-rules-header";

interface CoreRulesScreenProps {
  readonly coreRules: readonly CoreRule[];
  readonly edition: CoreRulesEdition;
}

/**
 * The whole document in printed order under a header that does not scroll. The reading column is
 * capped and centered, so a tablet gets one comfortable measure rather than a full-frame line.
 */
function CoreRulesScreen({ coreRules, edition }: CoreRulesScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView style={styles.screen}>
      <CoreRulesHeader coreRules={coreRules} edition={edition} />
      <FlatList
        contentContainerStyle={[
          styles.column,
          {
            paddingBottom: insets.bottom + Spacing.five,
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
          },
        ]}
        data={coreRules}
        keyExtractor={(coreRule) => coreRule.number}
        renderItem={({ item }) => <CoreRuleRow barColor={theme.border} coreRule={item} />}
        style={styles.document}
      />
    </ThemedView>
  );
}

export { CoreRulesScreen };
export type { CoreRulesScreenProps };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  document: {
    flex: 1,
  },
  column: {
    alignSelf: "center",
    maxWidth: MaxReadingWidth,
    paddingTop: Spacing.two,
    width: "100%",
  },
});
