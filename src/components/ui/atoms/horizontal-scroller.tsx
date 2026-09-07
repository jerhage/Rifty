import type { ReactNode } from "react";
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { Spacing } from "@/constants/theme";

/** A sideways scrolling row used for chips; can run off the screen. */
function HorizontalScroller({
  children,
  gap = Spacing.two - 1,
  style,
}: {
  readonly children: ReactNode;
  readonly gap?: number;
  readonly style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      contentContainerStyle={[styles.row, { gap }]}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
    >
      {children}
    </ScrollView>
  );
}

export { HorizontalScroller };

const styles = StyleSheet.create({
  row: {
    paddingRight: Spacing.three,
  },
});
