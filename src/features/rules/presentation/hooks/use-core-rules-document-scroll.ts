import { useCallback, useEffect, useRef } from "react";
import type { FlatList } from "react-native";

import type { CoreRule } from "@/features/rules/core-rule";

/** The target row sits this far below the header rather than flush under it. */
const CORE_RULE_SCROLL_OFFSET = 14;

/** Long enough for the list to lay out the rows the estimated jump landed among. */
const CORE_RULE_SCROLL_RETRY_MS = 250;

/** What the list reports when it cannot reach a row: its own estimate, and the row asked for. */
interface CoreRuleScrollFailure {
  readonly averageItemLength: number;
  readonly index: number;
}

/**
 * Moving the document to a row, and recovering when the list cannot.
 *
 * Rule bodies wrap, so row heights differ and `getItemLayout` cannot be written. Without it the
 * list refuses to scroll to a row it has never measured, which is every row beyond the render
 * window — exactly the long jumps stepping through hits and the contents make. So the failure is
 * handled: jump to the offset the list estimates for that row, which renders the rows around it,
 * then ask for the row again once they have laid out.
 *
 * **Nothing the screen moves is animated.** An animated jump across a 1364-entry document travels
 * every row between here and there, and the list renders each one it passes, a frame at a time.
 * Instant, it lays out one window at the destination and nothing in between. The recovery above
 * still happens on a long jump; it is simply no longer something a reader watches.
 */
function useCoreRulesDocumentScroll() {
  const documentRef = useRef<FlatList<CoreRule>>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (retryRef.current !== null) clearTimeout(retryRef.current);
    };
  }, []);

  const scrollToRow = useCallback((row: number) => {
    documentRef.current?.scrollToIndex({
      animated: false,
      index: row,
      viewOffset: CORE_RULE_SCROLL_OFFSET,
    });
  }, []);

  const retryScrollToRow = useCallback(
    (failure: CoreRuleScrollFailure) => {
      documentRef.current?.scrollToOffset({
        animated: false,
        offset: failure.averageItemLength * failure.index,
      });

      if (retryRef.current !== null) clearTimeout(retryRef.current);

      retryRef.current = setTimeout(() => {
        retryRef.current = null;
        scrollToRow(failure.index);
      }, CORE_RULE_SCROLL_RETRY_MS);
    },
    [scrollToRow],
  );

  return { documentRef, retryScrollToRow, scrollToRow };
}

export { CORE_RULE_SCROLL_OFFSET, CORE_RULE_SCROLL_RETRY_MS, useCoreRulesDocumentScroll };
export type { CoreRuleScrollFailure };
