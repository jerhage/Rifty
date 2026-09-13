import { BottomSheet, RNHostView } from "@expo/ui";
import type { ReactElement } from "react";

import { useLayoutSize } from "@/hooks/use-layout-size";
import { useTheme } from "@/hooks/use-theme";

function BottomSheetShell({
  children,
  isPresented,
  onDismiss,
}: {
  readonly children: ReactElement;
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
      snapPoints={layoutClass === "tablet" ? ["full"] : ["half", "full"]}
    >
      <RNHostView>{children}</RNHostView>
    </BottomSheet>
  );
}

export { BottomSheetShell };
