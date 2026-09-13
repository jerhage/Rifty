import type { ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { useLayoutSize } from "@/hooks/use-layout-size";
import { useTheme } from "@/hooks/use-theme";
import { UsableWidthProvider } from "@/hooks/use-usable-width";

const SecondaryMaxWidth = 392;
const SecondaryFrameShare = 0.34;

/** The narrow slot takes a share of the whole frame, rail included, and never more than its cap. */
function secondaryWidthFor(frameWidth: number): number {
  return Math.min(SecondaryMaxWidth, frameWidth * SecondaryFrameShare);
}

function SplitLayout({
  primary,
  secondary,
}: {
  readonly primary: ReactNode;
  readonly secondary: ReactNode;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { usableWidth } = useLayoutSize();
  const secondaryWidth = secondaryWidthFor(width);

  return (
    <View style={styles.split}>
      <View style={styles.primary}>
        <UsableWidthProvider width={usableWidth - secondaryWidth}>{primary}</UsableWidthProvider>
      </View>
      <View
        style={[
          styles.secondary,
          {
            borderStartColor: theme.border,
            width: secondaryWidth,
          },
        ]}
      >
        <UsableWidthProvider width={secondaryWidth}>{secondary}</UsableWidthProvider>
      </View>
    </View>
  );
}

export { secondaryWidthFor, SplitLayout };

const styles = StyleSheet.create({
  split: {
    flex: 1,
    flexDirection: "row",
  },
  primary: {
    flex: 1,
  },
  secondary: {
    borderStartWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
    flexShrink: 0,
  },
});
