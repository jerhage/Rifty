import { StyleSheet, View, type ColorValue } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleRowHighlight } from "@/features/rules/presentation/core-rule-highlight";

import { CoreRuleDetails } from "./core-rule-details";
import { CoreRuleText } from "./core-rule-text";

/** Wide enough for every printed number the document holds, so the body's left edge never moves. */
const CORE_RULE_NUMBER_GUTTER = 72;

interface CoreRuleNumberedRowProps {
  /** The row's state channel: faint while nothing claims it, and later selection and search. */
  readonly barColor: ColorValue;
  readonly coreRule: CoreRule;
  readonly highlight: CoreRuleRowHighlight | null;
}

function CoreRuleNumberedRow({ barColor, coreRule, highlight }: CoreRuleNumberedRowProps) {
  return (
    <View style={[styles.row, { borderLeftColor: barColor }]}>
      <ThemedText style={styles.number} themeColor="textTertiary" type="code">
        {coreRule.number}
      </ThemedText>
      <View style={styles.body}>
        <CoreRuleText highlight={highlight?.body ?? null} text={coreRule.body} type="body" />
        <CoreRuleDetails details={coreRule.details} highlight={highlight} />
      </View>
    </View>
  );
}

export { CORE_RULE_NUMBER_GUTTER, CoreRuleNumberedRow };
export type { CoreRuleNumberedRowProps };

const styles = StyleSheet.create({
  row: {
    borderLeftWidth: 2,
    flexDirection: "row",
    gap: Spacing.two,
    paddingLeft: Spacing.two,
    paddingVertical: Spacing.one,
  },
  number: {
    paddingTop: 1,
    width: CORE_RULE_NUMBER_GUTTER,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
});
