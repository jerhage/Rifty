import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Whether the platform asks for reduced motion, kept in step while the app is open. */
function useReduceMotion(): boolean {
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isCurrent) setIsReduced(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setIsReduced);

    return () => {
      isCurrent = false;
      subscription.remove();
    };
  }, []);

  return isReduced;
}

export { useReduceMotion };
