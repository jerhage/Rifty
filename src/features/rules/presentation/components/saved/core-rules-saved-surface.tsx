import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

import { CoreRulesSavedList } from "./core-rules-saved-list";

interface CoreRulesSavedSurfaceProps {
  readonly coreRules: readonly CoreRule[];
  /** Asked of every rule the document holds, whether or not a query has filtered it out of view. */
  readonly isBookmarked: (number: CoreRuleNumber) => boolean;
  readonly isNoted: (number: CoreRuleNumber) => boolean;
  readonly notesFor: (number: CoreRuleNumber) => ReactNode;
  readonly onGoToCoreRule: (number: CoreRuleNumber) => void;
  readonly onRemoveBookmark: (number: CoreRuleNumber) => void;
}

/** Everything the reader has kept on this screen: the rules they marked or wrote on, with the notes. */
function CoreRulesSavedSurface({
  coreRules,
  isBookmarked,
  isNoted,
  notesFor,
  onGoToCoreRule,
  onRemoveBookmark,
}: CoreRulesSavedSurfaceProps) {
  return (
    <View style={styles.surface}>
      <CoreRulesSavedList
        coreRules={coreRules}
        isBookmarked={isBookmarked}
        isNoted={isNoted}
        notesFor={notesFor}
        onGoToCoreRule={onGoToCoreRule}
        onRemoveBookmark={onRemoveBookmark}
      />
    </View>
  );
}

export { CoreRulesSavedSurface };
export type { CoreRulesSavedSurfaceProps };

const styles = StyleSheet.create({
  surface: {
    gap: Spacing.four,
    minWidth: 0,
  },
});
