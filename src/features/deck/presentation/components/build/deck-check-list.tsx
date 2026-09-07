import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { DeckVerification } from "@/features/deck/deck/deck";
import { useTheme } from "@/hooks/use-theme";

function DeckCheckList({ verification }: { readonly verification: DeckVerification }) {
  const theme = useTheme();

  return match(verification)
    .with({ type: "legal" }, () => (
      <View style={[styles.banner, { backgroundColor: theme.fill, borderColor: theme.positive }]}>
        <ThemedText style={{ color: theme.positive }} type="small">
          Tournament legal
        </ThemedText>
      </View>
    ))
    .with({ type: "unverified" }, () => (
      <View style={[styles.banner, { backgroundColor: theme.fill, borderColor: theme.border }]}>
        <ThemedText themeColor="textSecondary" type="small">
          Not checked yet
        </ThemedText>
      </View>
    ))
    .with({ type: "illegal" }, ({ violations }) => (
      <View style={styles.list}>
        {violations.map((violation) => (
          <View
            key={`${violation.rule}-${violation.type === "cardConstraint" ? violation.cardRiftboundId : ""}`}
            style={[styles.row, { backgroundColor: theme.fill, borderColor: theme.border }]}
          >
            <View style={[styles.mark, { backgroundColor: theme.negative }]} />
            <ThemedText themeColor="textSecondary" type="body" style={styles.message}>
              {violation.message}
            </ThemedText>
          </View>
        ))}
      </View>
    ))
    .exhaustive();
}

export { DeckCheckList };

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three - 4,
  },
  list: {
    gap: Spacing.two - 1,
  },
  row: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two + 2,
    padding: Spacing.three - 4,
  },
  mark: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  message: {
    flex: 1,
    minWidth: 0,
  },
});
