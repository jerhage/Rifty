import { BottomSheet, RNHostView, type SnapPoint } from "@expo/ui";
import type { ReactElement } from "react";

import { useLayoutSize, type LayoutClass } from "@/hooks/use-layout-size";
import { useTheme } from "@/hooks/use-theme";

/** `@expo/ui` honors a fraction on iOS and web only; on Android it snaps to the nearer of its own
 * half and full stops. */
function snapPointsFor(layoutClass: LayoutClass, heightFraction: number | undefined): SnapPoint[] {
  if (heightFraction !== undefined) return [{ fraction: heightFraction }];

  return layoutClass === "tablet" ? ["full"] : ["half", "full"];
}

function BottomSheetShell({
  children,
  heightFraction,
  isPresented,
  onDismiss,
}: {
  readonly children: ReactElement;
  readonly heightFraction?: number;
  readonly isPresented: boolean;
  readonly onDismiss: () => void;
}) {
  const theme = useTheme();
  const { layoutClass } = useLayoutSize();

  return (
    <BottomSheet
      containerColor={theme.backgroundSheet}
      isPresented={isPresented}
      onDismiss={onDismiss}
      snapPoints={snapPointsFor(layoutClass, heightFraction)}
    >
      <RNHostView>{children}</RNHostView>
    </BottomSheet>
  );
}

export { BottomSheetShell };
