import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import type { MulliganStatusMessage } from "../../draw-simulation-format";

function MulliganStatusBar({
  counter,
  message,
}: {
  readonly counter: string;
  readonly message: MulliganStatusMessage;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.status, { backgroundColor: theme.fill, borderColor: theme.border }]}>
      <ThemedText style={styles.message} themeColor={messageColor(message)} type="body">
        {message.text}
      </ThemedText>
      <ThemedText themeColor="textTertiary" type="mono">
        {counter}
      </ThemedText>
    </View>
  );
}

function messageColor(message: MulliganStatusMessage): ThemeColor {
  return match<MulliganStatusMessage, ThemeColor>(message)
    .with({ type: "note" }, () => "textSecondary")
    .with({ type: "warning" }, () => "warning")
    .exhaustive();
}

export { MulliganStatusBar };

const styles = StyleSheet.create({
  status: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two + 2,
    justifyContent: "space-between",
    marginTop: Spacing.three - 5,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two + 2,
  },
  message: {
    flex: 1,
    minWidth: 0,
  },
});
