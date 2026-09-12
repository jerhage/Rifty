import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/atoms/button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function SheetFace({
  action,
  body,
  confirmLabel,
  onConfirm,
  title,
}: {
  /** Optional control on the title row, opposite the title. */
  readonly action?: ReactNode;
  readonly body: ReactNode;
  readonly confirmLabel: string;
  readonly onConfirm: () => void;
  readonly title: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.face}>
      <View style={styles.titleRow}>
        <ThemedText accessibilityRole="header" type="display" style={styles.title}>
          {title}
        </ThemedText>
        {action}
      </View>
      <ScrollView contentContainerStyle={styles.body} style={styles.scroll}>
        {body}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Button label={confirmLabel} onPress={onConfirm} variant="primary" />
      </View>
    </View>
  );
}

export { SheetFace };

const styles = StyleSheet.create({
  face: {
    flex: 1,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.two,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
  },
  scroll: {
    flexGrow: 1,
    height: 0,
  },
  body: {
    gap: Spacing.four,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.three - 2,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.three - 4,
  },
});
