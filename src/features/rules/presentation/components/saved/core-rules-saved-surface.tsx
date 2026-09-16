import { StyleSheet, View } from "react-native";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import { Spacing } from "@/constants/theme";
import type { NoteManager } from "@/features/annotation/note-manager";
import { Scratchpad } from "@/features/annotation/presentation/components/scratchpad";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

import { CoreRulesSavedList } from "./core-rules-saved-list";

interface CoreRulesSavedSurfaceProps {
  /** Every rule the reader has marked, whether or not a query has filtered it out of view. */
  readonly bookmarkedNumbers: ReadonlySet<CoreRuleNumber>;
  readonly clock: Clock;
  readonly coreRules: readonly CoreRule[];
  readonly idGenerator: IdGenerator;
  readonly noteManager: NoteManager;
  readonly onGoToCoreRule: (number: CoreRuleNumber) => void;
  readonly onRemoveBookmark: (number: CoreRuleNumber) => void;
}

/** Everything the reader has kept: the scratchpad first, the bookmarked rules under it. */
function CoreRulesSavedSurface({
  bookmarkedNumbers,
  clock,
  coreRules,
  idGenerator,
  noteManager,
  onGoToCoreRule,
  onRemoveBookmark,
}: CoreRulesSavedSurfaceProps) {
  return (
    <View style={styles.surface}>
      <Scratchpad clock={clock} idGenerator={idGenerator} noteManager={noteManager} />
      <CoreRulesSavedList
        bookmarkedNumbers={bookmarkedNumbers}
        clock={clock}
        coreRules={coreRules}
        idGenerator={idGenerator}
        noteManager={noteManager}
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
