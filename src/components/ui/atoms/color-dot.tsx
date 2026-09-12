import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { Radius } from "@/constants/theme";

type ColorDotShape = "dot" | "diamond";

/** A small colored square, for showing which category something belongs to. */
function ColorDot({
  color,
  shape = "dot",
  size = 7,
}: {
  readonly color: string;
  readonly shape?: ColorDotShape;
  readonly size?: number;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        match(shape)
          .with("dot", () => styles.dot)
          .with("diamond", () => styles.diamond)
          .exhaustive(),
        { backgroundColor: color, height: size, width: size },
      ]}
    />
  );
}

export { ColorDot };
export type { ColorDotShape };

const styles = StyleSheet.create({
  dot: {
    borderRadius: Radius.small,
  },
  diamond: {
    borderRadius: 2,
    transform: [{ rotate: "45deg" }],
  },
});
