import type { FlashListRef } from "@shopify/flash-list";
import { useCallback, useRef } from "react";

import type { CoreRule } from "@/features/rules/core-rule";

/** The target row sits this far below the header rather than flush under it. */
const CORE_RULE_SCROLL_OFFSET = 14;

function useCoreRulesDocumentScroll() {
  const documentRef = useRef<FlashListRef<CoreRule>>(null);

  const scrollToRow = useCallback((row: number) => {
    /** FlashList *adds* `viewOffset`, so room above the row is asked for as a negative number. */
    void documentRef.current?.scrollToIndex({
      animated: true,
      index: row,
      viewOffset: -CORE_RULE_SCROLL_OFFSET,
    });
  }, []);

  return { documentRef, scrollToRow };
}

export { CORE_RULE_SCROLL_OFFSET, useCoreRulesDocumentScroll };
