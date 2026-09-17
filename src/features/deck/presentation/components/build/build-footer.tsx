import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/atoms/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type BuildActionAvailability = "busy" | "ready";

function BuildFooter({
  actionAvailability,
  actionLabel,
  children,
  onAction,
}: {
  readonly actionAvailability: BuildActionAvailability;
  readonly actionLabel: string;
  readonly children: ReactNode;
  readonly onAction: () => void;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isBusy = actionAvailability === "busy";

  return (
    <View
      style={[
        styles.footer,
        {
          borderTopColor: theme.border,
          paddingBottom: insets.bottom + Spacing.three,
          paddingLeft: insets.left + Spacing.three,
          paddingRight: insets.right + Spacing.three,
        },
      ]}
    >
      <View style={styles.info}>{children}</View>
      <Button
        busy={isBusy}
        disabled={isBusy}
        label={actionLabel}
        onPress={onAction}
        variant="primary"
      />
    </View>
  );
}

export { BuildFooter };
export type { BuildActionAvailability };

const styles = StyleSheet.create({
  footer: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.three - 4,
    paddingTop: Spacing.two + 2,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
});
