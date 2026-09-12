import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function Panel({
  children,
  note,
  title,
}: {
  readonly children: ReactNode;
  readonly note?: ReactNode;
  readonly title: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <View style={styles.header}>
        <ThemedText
          accessibilityRole="header"
          style={styles.title}
          themeColor="textTertiary"
          type="mono"
        >
          {title}
        </ThemedText>
        {note}
      </View>
      {children}
    </View>
  );
}

export { Panel };

const styles = StyleSheet.create({
  panel: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three - 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    justifyContent: "space-between",
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
  },
});
