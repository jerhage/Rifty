import { useMemo } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing, TouchTarget } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import {
  coreRuleRowKindOf,
  coreRulesContents,
} from "@/features/rules/presentation/core-rules-format";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

/** The design's 34 points at the default size, and the same room at every size above it. */
const NUMBER_WIDTH = 34;

function coreRulesContentsNumberWidth(fontScale: number): number {
  return Math.ceil(NUMBER_WIDTH * fontScale);
}

interface CoreRulesContentsListProps {
  readonly coreRules: readonly CoreRule[];
  readonly onSelectEntry: (number: CoreRuleNumber) => void;
}

/** It holds no scroller of its own, so each container decides how its own list scrolls. */
function CoreRulesContentsList({ coreRules, onSelectEntry }: CoreRulesContentsListProps) {
  const contents = useMemo(() => coreRulesContents(coreRules), [coreRules]);
  const { fontScale } = useWindowDimensions();

  return (
    <View style={styles.list}>
      {contents.map((coreRule) => (
        <CoreRulesContentsEntry
          coreRule={coreRule}
          key={coreRule.number}
          numberWidth={coreRulesContentsNumberWidth(fontScale)}
          onSelect={() => onSelectEntry(coreRule.number)}
        />
      ))}
    </View>
  );
}

/** A chapter names what follows it, so it is set a step above the headings it gathers. */
function CoreRulesContentsEntry({
  coreRule,
  numberWidth,
  onSelect,
}: {
  readonly coreRule: CoreRule;
  readonly numberWidth: number;
  readonly onSelect: () => void;
}) {
  const isChapter = coreRuleRowKindOf(coreRule) === "chapter";

  return (
    <Pressable
      accessibilityLabel={`${coreRule.number} ${coreRule.body}`}
      accessibilityRole="button"
      onPress={onSelect}
      style={({ pressed }) => [
        styles.entry,
        isChapter && styles.chapterEntry,
        pressed && styles.pressed,
      ]}
    >
      <ThemedText style={[styles.number, { width: numberWidth }]} themeColor="accent" type="code">
        {coreRule.number}
      </ThemedText>
      <ThemedText
        style={styles.name}
        themeColor={isChapter ? "text" : "textSecondary"}
        type={isChapter ? "heading" : "body"}
      >
        {coreRule.body}
      </ThemedText>
    </Pressable>
  );
}

export { CoreRulesContentsList, coreRulesContentsNumberWidth };
export type { CoreRulesContentsListProps };

const styles = StyleSheet.create({
  list: {
    minWidth: 0,
  },
  entry: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two + 2,
    minHeight: TouchTarget.minimum,
    minWidth: 0,
    paddingVertical: Spacing.one,
  },
  chapterEntry: {
    paddingTop: Spacing.three,
  },
  number: {
    flexGrow: 0,
    flexShrink: 0,
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.7,
  },
});
