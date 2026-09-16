import { StyleSheet, View, type ColorValue } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";

import { CoreRuleDetails } from "./core-rule-details";

/** Wide enough for every printed number the document holds, so the body's left edge never moves. */
const CORE_RULE_NUMBER_GUTTER = 72;

interface CoreRuleNumberedRowProps {
  /** The row's state channel: faint while nothing claims it, and later selection and search. */
  readonly barColor: ColorValue;
  readonly coreRule: CoreRule;
}

function CoreRuleNumberedRow({ barColor, coreRule }: CoreRuleNumberedRowProps) {
  return (
    <View style={[styles.row, { borderLeftColor: barColor }]}>
      <ThemedText style={styles.number} themeColor="textTertiary" type="code">
        {coreRule.number}
      </ThemedText>
      <View style={styles.body}>
        <ThemedText type="body">{coreRule.body}</ThemedText>
        <CoreRuleDetails details={coreRule.details} />
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
