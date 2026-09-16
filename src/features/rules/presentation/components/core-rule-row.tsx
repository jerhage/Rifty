import { StyleSheet, View, type ColorValue } from "react-native";
import { match } from "ts-pattern";

import type { CoreRule } from "@/features/rules/core-rule";
import {
  coreRuleHighlightWash,
  type CoreRuleRowHighlight,
} from "@/features/rules/presentation/core-rule-highlight";
import { coreRuleRowKindOf } from "@/features/rules/presentation/core-rules-format";
import { useTheme } from "@/hooks/use-theme";

import { CoreRuleChapterRow } from "./core-rule-chapter-row";
import { CoreRuleHeadingRow } from "./core-rule-heading-row";
import { CoreRuleNumberedRow } from "./core-rule-numbered-row";

interface CoreRuleRowProps {
  readonly barColor: ColorValue;
  readonly coreRule: CoreRule;
  /** Absent while nothing is searched, or while this rule holds no occurrence of the query. */
  readonly highlight: CoreRuleRowHighlight | null;
}

/** The row the reader is standing on is tinted, so the active hit is findable without its offset. */
function CoreRuleRow({ barColor, coreRule, highlight }: CoreRuleRowProps) {
  const theme = useTheme();
  const backgroundColor =
    highlight?.holdsActiveHit === true ? coreRuleHighlightWash(theme, "row") : "transparent";

  return (
    <View style={[styles.row, { backgroundColor }]}>
      {match(coreRuleRowKindOf(coreRule))
        .with("chapter", () => <CoreRuleChapterRow coreRule={coreRule} highlight={highlight} />)
        .with("heading", () => <CoreRuleHeadingRow coreRule={coreRule} highlight={highlight} />)
        .with("rule", () => (
          <CoreRuleNumberedRow barColor={barColor} coreRule={coreRule} highlight={highlight} />
        ))
        .exhaustive()}
    </View>
  );
}

export { CoreRuleRow };
export type { CoreRuleRowProps };

const styles = StyleSheet.create({
  row: {
    minWidth: 0,
  },
});
