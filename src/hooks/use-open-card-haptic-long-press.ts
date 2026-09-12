import * as Haptics from "expo-haptics";
import { useCallback } from "react";

/** Wraps a long-press handler so the taptic engine fires without delaying it. */
function useImpactLongPress(
  onLongPress: () => void,
  style: Haptics.ImpactFeedbackStyle,
): () => void {
  return useCallback(() => {
    Haptics.impactAsync(style).catch(() => undefined);
    onLongPress();
  }, [onLongPress, style]);
}

function useOpenCardHapticLongPress(open: () => void): () => void {
  return useImpactLongPress(open, Haptics.ImpactFeedbackStyle.Medium);
}

export { useOpenCardHapticLongPress };
