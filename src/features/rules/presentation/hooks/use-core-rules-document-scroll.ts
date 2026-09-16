import type { FlashListRef } from "@shopify/flash-list";
import { useCallback, useRef } from "react";

import type { CoreRule } from "@/features/rules/core-rule";

/** The target row sits this far below the header rather than flush under it. */
const CORE_RULE_SCROLL_OFFSET = 14;

/**
 * Moving the document to a row.
 *
 * The list keeps its own layout for every entry, measured or not, so a row it has never drawn is
 * reachable on the first ask. Nothing has to be estimated, retried, or recovered from, and a jump
 * costs the same whether or not the reader has been that way before.
 *
 * A jump is animated, so the reader sees where they were carried rather than being teleported. That
 * was not affordable while the list mounted a fresh row for every one it passed; this list recycles
 * a handful of views instead, so the same travel costs a fraction of the work.
 */
function useCoreRulesDocumentScroll() {
  const documentRef = useRef<FlashListRef<CoreRule>>(null);

  const scrollToRow = useCallback((row: number) => {
    /**
     * The list *adds* `viewOffset` to the offset it lands on, so room above the row is asked for
     * with a negative number. The promise settles when the movement is done and there is nothing to
     * do then: the caller is a press handler that has already said everything it had to say.
     */
    void documentRef.current?.scrollToIndex({
      animated: true,
      index: row,
      viewOffset: -CORE_RULE_SCROLL_OFFSET,
    });
  }, []);

  return { documentRef, scrollToRow };
}

export { CORE_RULE_SCROLL_OFFSET, useCoreRulesDocumentScroll };
