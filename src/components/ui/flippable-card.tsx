import { useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

const FLIP_DURATION = 180;

interface FlippableCardProps {
  readonly back: ReactNode;
  readonly front: ReactNode;
  readonly showBackAccessibilityLabel?: string;
  readonly showFrontAccessibilityLabel?: string;
}

function FlippableCard({
  back,
  front,
  showBackAccessibilityLabel = "Show card back",
  showFrontAccessibilityLabel = "Show card front",
}: FlippableCardProps) {
  const [showsBack, setShowsBack] = useState(false);
  const isAnimating = useRef(false);
  const flip = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    Animated.timing(flip, {
      toValue: 1,
      duration: FLIP_DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        isAnimating.current = false;
        return;
      }

      flip.setValue(-1);
      setShowsBack((current) => !current);
      requestAnimationFrame(() => {
        Animated.timing(flip, {
          toValue: 0,
          duration: FLIP_DURATION,
          useNativeDriver: true,
        }).start(() => {
          isAnimating.current = false;
        });
      });
    });
  };

  return (
    <Pressable
      accessibilityLabel={showsBack ? showFrontAccessibilityLabel : showBackAccessibilityLabel}
      accessibilityRole="button"
      onPress={toggle}
    >
      <Animated.View
        style={[
          styles.face,
          {
            transform: [
              { perspective: 1_000 },
              {
                rotateY: flip.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: ["-90deg", "0deg", "90deg"],
                }),
              },
            ],
          },
        ]}
      >
        {showsBack ? back : front}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    width: "100%",
  },
});

export { FlippableCard };
