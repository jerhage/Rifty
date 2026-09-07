import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { PrimaryButton } from "@/components/ui/atoms/primary-button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Shared chrome for a bottom-sheet page: title row, scrolling body, pinned confirm button. */
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
        <ThemedText type="display" style={styles.title}>
          {title}
        </ThemedText>
        {action}
      </View>
      <ScrollView contentContainerStyle={styles.body}>{body}</ScrollView>
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <PrimaryButton label={confirmLabel} onPress={onConfirm} />
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
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.two,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
  },
  body: {
    gap: Spacing.four,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.three - 2,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.three - 4,
  },
});
