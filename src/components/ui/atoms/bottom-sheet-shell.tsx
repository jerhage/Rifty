import { BottomSheet, RNHostView } from "@expo/ui";
import type { ReactElement } from "react";

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

  return (
    <BottomSheet
      containerColor={theme.backgroundSheet}
      isPresented={isPresented}
      onDismiss={onDismiss}
      snapPoints={["half", "full"]}
    >
      <RNHostView>{children}</RNHostView>
    </BottomSheet>
  );
}

export { BottomSheetShell };
