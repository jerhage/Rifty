import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/atoms/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function BuildFooter({
  actionLabel,
  children,
  isActionBusy = false,
  isActionEnabled = true,
  onAction,
}: {
  readonly actionLabel: string;
  readonly children: ReactNode;
  readonly isActionBusy?: boolean;
  readonly isActionEnabled?: boolean;
  readonly onAction: () => void;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.footer,
        { borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.three },
      ]}
    >
      <View style={styles.info}>{children}</View>
      <Button
        busy={isActionBusy}
        disabled={!isActionEnabled}
        label={actionLabel}
        onPress={onAction}
        variant="primary"
      />
    </View>
  );
}

export { BuildFooter };

const styles = StyleSheet.create({
  footer: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two + 2,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
});
