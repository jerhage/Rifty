import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CoreRuleDetail } from "@/features/rules/core-rule";
import { useTheme } from "@/hooks/use-theme";

/** The bullets and examples printed under a rule. They are never folded into its body. */
function CoreRuleDetails({ details }: { readonly details: readonly CoreRuleDetail[] }) {
  if (details.length === 0) return null;

  return (
    <View style={styles.details}>
      {details.map((detail) =>
        match(detail)
          .with({ kind: "bullet" }, (bullet) => (
            <CoreRuleBullet body={bullet.body} key={bullet.position} />
          ))
          .with({ kind: "example" }, (example) => (
            <CoreRuleExample body={example.body} key={example.position} />
          ))
          .exhaustive(),
      )}
    </View>
  );
}

function CoreRuleBullet({ body }: { readonly body: string }) {
  return (
    <View style={styles.bullet}>
      <ThemedText themeColor="textTertiary" type="body">
        ·
      </ThemedText>
      <ThemedText style={styles.bulletBody} themeColor="textSecondary" type="body">
        {body}
      </ThemedText>
    </View>
  );
}

function CoreRuleExample({ body }: { readonly body: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.example, { borderLeftColor: theme.border }]}>
      <ThemedText themeColor="textTertiary" type="mono">
        Example
      </ThemedText>
      <ThemedText themeColor="textSecondary" type="body">
        {body}
      </ThemedText>
    </View>
  );
}

export { CoreRuleDetails };

const styles = StyleSheet.create({
  details: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  bullet: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingLeft: Spacing.three,
  },
  bulletBody: {
    flex: 1,
  },
  example: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    marginLeft: Spacing.three,
    paddingLeft: Spacing.two + Spacing.one,
  },
});
