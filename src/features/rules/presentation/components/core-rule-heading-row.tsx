import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleRowHighlight } from "@/features/rules/presentation/core-rule-highlight";

import { CoreRuleText } from "./core-rule-text";

/** A heading below chapter level: the same baseline as a chapter, a step down and no divider. */
function CoreRuleHeadingRow({
  coreRule,
  highlight,
}: {
  readonly coreRule: CoreRule;
  readonly highlight: CoreRuleRowHighlight | null;
}) {
  return (
    <View accessibilityRole="header" style={styles.row}>
      <ThemedText themeColor="accent" type="code">
        {coreRule.number}
      </ThemedText>
      <View style={styles.name}>
        <CoreRuleText highlight={highlight?.body ?? null} text={coreRule.body} type="heading" />
      </View>
    </View>
  );
}

export { CoreRuleHeadingRow };

const styles = StyleSheet.create({
  row: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
});
