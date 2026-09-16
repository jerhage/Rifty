import { Pressable, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { Radius } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import {
  coreRuleBarColor,
  coreRuleRowSurface,
  type CoreRuleRowHighlight,
} from "@/features/rules/presentation/core-rule-highlight";
import { coreRuleRowKindOf } from "@/features/rules/presentation/core-rules-format";
import { useTheme } from "@/hooks/use-theme";

import { CoreRuleChapterRow } from "./core-rule-chapter-row";
import { CoreRuleHeadingRow } from "./core-rule-heading-row";
import { CoreRuleNumberedRow } from "./core-rule-numbered-row";

interface CoreRuleRowProps {
  readonly coreRule: CoreRule;
  /** Absent while nothing is searched, or while this rule holds no occurrence of the query. */
  readonly highlight: CoreRuleRowHighlight | null;
  readonly onSelect: () => void;
  readonly selected: boolean;
}

/**
 * A numbered rule is the entry a reader chooses, so it is the only row that presses. A chapter and
 * a heading name what is beneath them and are nothing to choose.
 *
 * The row the reader is standing on is tinted, so the active hit is findable without its offset,
 * and a row the reader has chosen outranks that tint on all three channels.
 */
function CoreRuleRow({ coreRule, highlight, onSelect, selected }: CoreRuleRowProps) {
  const theme = useTheme();
  const surface = coreRuleRowSurface(theme, highlight, selected);

  return match(coreRuleRowKindOf(coreRule))
    .with("chapter", () => (
      <View style={[styles.row, surface]}>
        <CoreRuleChapterRow coreRule={coreRule} highlight={highlight} />
      </View>
    ))
    .with("heading", () => (
      <View style={[styles.row, surface]}>
        <CoreRuleHeadingRow coreRule={coreRule} highlight={highlight} />
      </View>
    ))
    .with("rule", () => (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onSelect}
        style={({ pressed }) => [styles.row, surface, pressed && styles.pressed]}
      >
        <CoreRuleNumberedRow
          barColor={coreRuleBarColor(theme, highlight, selected)}
          coreRule={coreRule}
          highlight={highlight}
        />
      </Pressable>
    ))
    .exhaustive();
}

export { CoreRuleRow };
export type { CoreRuleRowProps };

const styles = StyleSheet.create({
  row: {
    borderRadius: Radius.small,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.7,
  },
});
