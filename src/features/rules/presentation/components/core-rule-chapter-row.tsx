import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleRowHighlight } from "@/features/rules/presentation/core-rule-highlight";
import { useTheme } from "@/hooks/use-theme";

import { CoreRuleText } from "./core-rule-text";

/** One of the document's five century-boundary headings, set apart by a rule across the column. */
function CoreRuleChapterRow({
  coreRule,
  highlight,
}: {
  readonly coreRule: CoreRule;
  readonly highlight: CoreRuleRowHighlight | null;
}) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      <View accessibilityRole="header" style={styles.title}>
        <ThemedText themeColor="accent" type="code">
          {coreRule.number}
        </ThemedText>
        <View style={styles.name}>
          <CoreRuleText highlight={highlight?.body ?? null} text={coreRule.body} type="display" />
        </View>
      </View>
    </View>
  );
}

export { CoreRuleChapterRow };

const styles = StyleSheet.create({
  row: {
    gap: Spacing.three,
    paddingTop: Spacing.four,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  title: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: Spacing.two,
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
});
