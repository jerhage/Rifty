import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";

/** A block of controls introduced by a small uppercase label. */
function LabelledSection({
  children,
  label,
}: {
  readonly children: ReactNode;
  readonly label: string;
}) {
  return (
    <View style={styles.section}>
      <ThemedText themeColor="textTertiary" type="mono">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

export { LabelledSection };

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two + 1,
  },
});
