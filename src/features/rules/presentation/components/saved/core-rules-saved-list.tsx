import { useMemo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/ui/atoms/empty-state";
import { LabelledSection } from "@/components/ui/atoms/labelled-section";
import { Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import {
  CORE_RULES_NOTHING_SAVED_MESSAGE,
  coreRuleSavedSectionLabel,
} from "@/features/rules/presentation/core-rules-format";
import { savedCoreRules } from "@/features/rules/presentation/core-rules-saved";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

import { CoreRulesSavedEntry } from "./core-rules-saved-entry";

interface CoreRulesSavedListProps {
  /** Every rule the reader has marked, whether or not a query has filtered it out of view. */
  readonly bookmarkedNumbers: ReadonlySet<CoreRuleNumber>;
  readonly coreRules: readonly CoreRule[];
  readonly notesFor: (number: CoreRuleNumber) => ReactNode;
  readonly onGoToCoreRule: (number: CoreRuleNumber) => void;
  readonly onRemoveBookmark: (number: CoreRuleNumber) => void;
}

/**
 * What the reader has kept, in document order rather than the order the marks were made. It holds
 * no scroller of its own, so each container decides how its own list scrolls.
 */
function CoreRulesSavedList({
  bookmarkedNumbers,
  coreRules,
  notesFor,
  onGoToCoreRule,
  onRemoveBookmark,
}: CoreRulesSavedListProps) {
  const saved = useMemo(
    () => savedCoreRules(coreRules, bookmarkedNumbers),
    [bookmarkedNumbers, coreRules],
  );

  return (
    <LabelledSection label={coreRuleSavedSectionLabel(saved.length)}>
      {saved.length === 0 ? (
        <EmptyState message={CORE_RULES_NOTHING_SAVED_MESSAGE} />
      ) : (
        <View style={styles.list}>
          {saved.map((entry) => (
            <CoreRulesSavedEntry
              key={entry.coreRule.number}
              notes={notesFor(entry.coreRule.number)}
              onGoToCoreRule={onGoToCoreRule}
              onRemoveBookmark={onRemoveBookmark}
              saved={entry}
            />
          ))}
        </View>
      )}
    </LabelledSection>
  );
}

export { CoreRulesSavedList };
export type { CoreRulesSavedListProps };

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two + 1,
    minWidth: 0,
  },
});
