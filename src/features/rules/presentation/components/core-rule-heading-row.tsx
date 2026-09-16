import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";

/** A heading below chapter level: the same baseline as a chapter, a step down and no divider. */
function CoreRuleHeadingRow({ coreRule }: { readonly coreRule: CoreRule }) {
  return (
    <View accessibilityRole="header" style={styles.row}>
      <ThemedText themeColor="accent" type="code">
        {coreRule.number}
      </ThemedText>
      <ThemedText style={styles.name} type="heading">
        {coreRule.body}
      </ThemedText>
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
