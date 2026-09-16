import { StyleSheet, useWindowDimensions, View, type ColorValue } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleRowHighlight } from "@/features/rules/presentation/core-rule-highlight";

import { CoreRuleDetails } from "./core-rule-details";
import { CoreRuleText } from "./core-rule-text";

/** `648.8.f.1.b` and two others: eleven characters is the widest number the document prints. */
const CORE_RULE_NUMBER_CHARACTERS = 11;

/** `code` is monospace at 12 points, and a monospace glyph advances six tenths of its size. */
const CORE_RULE_NUMBER_CHARACTER_WIDTH = 12 * 0.6;

/**
 * Wide enough for every printed number the document holds, so the body's left edge never moves —
 * at whatever size the reader has asked for. A fixed 72 points held ten characters, so it wrapped
 * the three eleven-character numbers at the default size and more of them at every size above it.
 */
function coreRuleNumberGutter(fontScale: number): number {
  return Math.ceil(CORE_RULE_NUMBER_CHARACTERS * CORE_RULE_NUMBER_CHARACTER_WIDTH * fontScale);
}

interface CoreRuleNumberedRowProps {
  /** The row's state channel: faint while nothing claims it, and later selection and search. */
  readonly barColor: ColorValue;
  readonly coreRule: CoreRule;
  readonly highlight: CoreRuleRowHighlight | null;
}

function CoreRuleNumberedRow({ barColor, coreRule, highlight }: CoreRuleNumberedRowProps) {
  const { fontScale } = useWindowDimensions();

  return (
    <View style={[styles.row, { borderLeftColor: barColor }]}>
      <ThemedText
        style={[styles.number, { width: coreRuleNumberGutter(fontScale) }]}
        themeColor="textTertiary"
        type="code"
      >
        {coreRule.number}
      </ThemedText>
      <View style={styles.body}>
        <CoreRuleText highlight={highlight?.body ?? null} text={coreRule.body} type="body" />
        <CoreRuleDetails details={coreRule.details} highlight={highlight} />
      </View>
    </View>
  );
}

export { CoreRuleNumberedRow, coreRuleNumberGutter };
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
    flexGrow: 0,
    flexShrink: 0,
    paddingTop: 1,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
});
