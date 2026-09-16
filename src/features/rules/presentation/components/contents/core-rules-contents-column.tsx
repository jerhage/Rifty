import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";
import { useTheme } from "@/hooks/use-theme";

import { CoreRulesContentsList } from "./core-rules-contents-list";

/** The width the design gives the column, wide enough for a two-line heading beside its number. */
const CONTENTS_WIDTH = 196;

interface CoreRulesContentsColumnProps {
  readonly coreRules: readonly CoreRule[];
  readonly onSelectEntry: (number: CoreRuleNumber) => void;
}

/**
 * The contents standing beside the document rather than over it, where there is room for both.
 * Nothing opened it and an entry closes nothing: the reader keeps the list while they read.
 *
 * It scrolls on its own, so the document moving underneath leaves the reader's place in the
 * contents where they left it. It sits against the leading edge of the page, which has already
 * paid the safe-area inset and the side padding it stands in.
 */
function CoreRulesContentsColumn({ coreRules, onSelectEntry }: CoreRulesContentsColumnProps) {
  const theme = useTheme();

  return (
    <View style={[styles.column, { borderEndColor: theme.border }]}>
      <ThemedText accessibilityRole="header" themeColor="textTertiary" type="mono">
        Contents
      </ThemedText>
      <ScrollView contentContainerStyle={styles.scrolled} style={styles.scroll}>
        <CoreRulesContentsList coreRules={coreRules} onSelectEntry={onSelectEntry} />
      </ScrollView>
    </View>
  );
}

export { CoreRulesContentsColumn };
export type { CoreRulesContentsColumnProps };

const styles = StyleSheet.create({
  column: {
    borderEndWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
    flexShrink: 0,
    gap: Spacing.one,
    paddingRight: Spacing.three,
    paddingTop: Spacing.two,
    width: CONTENTS_WIDTH,
  },
  scroll: {
    flex: 1,
  },
  scrolled: {
    paddingBottom: Spacing.five,
  },
});
