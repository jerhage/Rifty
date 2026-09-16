import { View } from "react-native";

import { BottomSheetShell } from "@/components/ui/atoms/bottom-sheet-shell";
import { SheetFace } from "@/components/ui/atoms/sheet-face";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

import { CoreRulesContentsList } from "./core-rules-contents-list";

interface CoreRulesContentsSheetProps {
  readonly coreRules: readonly CoreRule[];
  readonly isOpen: boolean;
  readonly onDismiss: () => void;
  readonly onSelectEntry: (number: CoreRuleNumber) => void;
}

/**
 * The contents over the document, where there is no room beside it. The face is built only while
 * the sheet is open, so a document's worth of entries is not laid out behind a closed sheet.
 */
function CoreRulesContentsSheet({
  coreRules,
  isOpen,
  onDismiss,
  onSelectEntry,
}: CoreRulesContentsSheetProps) {
  return (
    <BottomSheetShell isPresented={isOpen} onDismiss={onDismiss}>
      {isOpen ? (
        <SheetFace
          body={<CoreRulesContentsList coreRules={coreRules} onSelectEntry={onSelectEntry} />}
          confirmLabel="Close"
          onConfirm={onDismiss}
          title="Contents"
        />
      ) : (
        <View />
      )}
    </BottomSheetShell>
  );
}

export { CoreRulesContentsSheet };
export type { CoreRulesContentsSheetProps };
