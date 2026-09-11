import * as Haptics from "expo-haptics";
import { useCallback } from "react";

/** Wraps a long-press handler so the taptic engine fires without delaying it. */
function useHapticLongPress(onLongPress: () => void): () => void {
  return useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
    onLongPress();
  }, [onLongPress]);
}

export { useHapticLongPress };
