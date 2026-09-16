import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import {
  coreRuleRemoveBookmarkLabel,
  coreRuleSavedContextLabel,
  coreRuleSavedEntryLabel,
  coreRuleSavedWash,
} from "@/features/rules/presentation/core-rules-format";
import type { SavedCoreRule } from "@/features/rules/presentation/core-rules-saved";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";
import { useTheme } from "@/hooks/use-theme";

/** Enough of the rule to recognize it by; the document itself is where it is read in full. */
const SAVED_RULE_LINES = 2;

interface CoreRulesSavedEntryProps {
  readonly notes: ReactNode;
  readonly onGoToCoreRule: (number: CoreRuleNumber) => void;
  readonly onRemoveBookmark: (number: CoreRuleNumber) => void;
  readonly saved: SavedCoreRule;
}

function CoreRulesSavedEntry({
  notes,
  onGoToCoreRule,
  onRemoveBookmark,
  saved,
}: CoreRulesSavedEntryProps) {
  const theme = useTheme();
  const { coreRule } = saved;

  return (
    <View
      style={[
        styles.entry,
        {
          backgroundColor: coreRuleSavedWash(theme, "surface"),
          borderColor: coreRuleSavedWash(theme, "edge"),
        },
      ]}
    >
      <View style={styles.head}>
        <Pressable
          accessibilityHint="Moves the document to this rule."
          accessibilityLabel={coreRuleSavedEntryLabel(saved)}
          accessibilityRole="button"
          onPress={() => onGoToCoreRule(coreRule.number)}
          style={({ pressed }) => [styles.jump, pressed && styles.pressed]}
        >
          <View style={styles.context}>
            <ThemedText themeColor="accent" type="code">
              {coreRule.number}
            </ThemedText>
            <ThemedText style={styles.heading} type="heading">
              {coreRuleSavedContextLabel(saved)}
            </ThemedText>
          </View>
          <ThemedText numberOfLines={SAVED_RULE_LINES} themeColor="textSecondary" type="body">
            {coreRule.body}
          </ThemedText>
        </Pressable>
        <Pressable
          accessibilityLabel={coreRuleRemoveBookmarkLabel(coreRule.number)}
          accessibilityRole="button"
          onPress={() => onRemoveBookmark(coreRule.number)}
          style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
        >
          <ThemedText themeColor="textTertiary" type="monoValue">
            ×
          </ThemedText>
        </Pressable>
      </View>
      {notes}
    </View>
  );
}

export { CoreRulesSavedEntry };
export type { CoreRulesSavedEntryProps };

const styles = StyleSheet.create({
  entry: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    minWidth: 0,
    padding: Spacing.two + 1,
  },
  head: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.two - 2,
    minWidth: 0,
  },
  jump: {
    flex: 1,
    gap: Spacing.one,
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: 0,
  },
  context: {
    alignItems: "baseline",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    minWidth: 0,
  },
  heading: {
    flexShrink: 1,
    minWidth: 0,
  },
  remove: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
  },
  pressed: {
    opacity: 0.7,
  },
});
