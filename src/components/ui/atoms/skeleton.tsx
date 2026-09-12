import { useEffect, useRef } from "react";
import { Animated, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { Radius } from "@/constants/theme";
import { useReduceMotion } from "@/hooks/use-reduce-motion";
import { useTheme } from "@/hooks/use-theme";

const PULSE_DURATION_MS = 850;
const STILL_OPACITY = 0.85;

function Skeleton({ style }: { readonly style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const isReduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isReduceMotion) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: PULSE_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: PULSE_DURATION_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [isReduceMotion, pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.skeleton,
        {
          backgroundColor: theme.backgroundElement,
          opacity: isReduceMotion
            ? STILL_OPACITY
            : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] }),
        },
        style,
      ]}
    />
  );
}

export { Skeleton };

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: Radius.small,
  },
});
