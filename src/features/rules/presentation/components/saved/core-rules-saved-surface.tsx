import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

import { CoreRulesSavedList } from "./core-rules-saved-list";

interface CoreRulesSavedSurfaceProps {
  /** Every rule the reader has marked, whether or not a query has filtered it out of view. */
  readonly bookmarkedNumbers: ReadonlySet<CoreRuleNumber>;
  readonly coreRules: readonly CoreRule[];
  readonly notesFor: (number: CoreRuleNumber) => ReactNode;
  readonly onGoToCoreRule: (number: CoreRuleNumber) => void;
  readonly onRemoveBookmark: (number: CoreRuleNumber) => void;
}

/** Everything the reader has kept on this screen: the rules they have bookmarked, with their notes. */
function CoreRulesSavedSurface({
  bookmarkedNumbers,
  coreRules,
  notesFor,
  onGoToCoreRule,
  onRemoveBookmark,
}: CoreRulesSavedSurfaceProps) {
  return (
    <View style={styles.surface}>
      <CoreRulesSavedList
        bookmarkedNumbers={bookmarkedNumbers}
        coreRules={coreRules}
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
