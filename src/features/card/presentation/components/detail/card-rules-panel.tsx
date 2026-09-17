import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { useTheme } from "@/hooks/use-theme";

function CardRulesPanel({ rulesText }: { readonly rulesText: Card["rulesText"] }) {
  const theme = useTheme();

  return (
    <View style={[styles.panel, { backgroundColor: theme.fill, borderColor: theme.border }]}>
      <ThemedText themeColor="text" type="body" style={styles.rules}>
        {rulesText.plain || "No rules text."}
      </ThemedText>
      {rulesText.flavour !== null && rulesText.flavour !== "" && (
        <ThemedText themeColor="textTertiary" type="body" style={styles.flavour}>
          {rulesText.flavour}
        </ThemedText>
      )}
    </View>
  );
}

export { CardRulesPanel };

const styles = StyleSheet.create({
  panel: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    marginTop: Spacing.three - 3,
    padding: Spacing.three - 3,
  },
  rules: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  flavour: {
    fontStyle: "italic",
  },
});
