import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function BuildFooter({
  actionLabel,
  children,
  isActionEnabled = true,
  onAction,
}: {
  readonly actionLabel: string;
  readonly children: ReactNode;
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
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        style={({ pressed }) => [
          styles.action,
          { backgroundColor: isActionEnabled ? theme.accent : theme.fill },
          pressed && styles.pressed,
        ]}
      >
        <ThemedText themeColor={isActionEnabled ? "onAccent" : "textSecondary"} type="smallBold">
          {actionLabel}
        </ThemedText>
      </Pressable>
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
  action: {
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.four - 2,
    paddingVertical: Spacing.three - 3,
  },
  pressed: {
    opacity: 0.7,
  },
});
