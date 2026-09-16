import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";
import type { CoreRuleDetail } from "@/features/rules/core-rule";
import type {
  CoreRuleHighlight,
  CoreRuleRowHighlight,
} from "@/features/rules/presentation/core-rule-highlight";
import { useTheme } from "@/hooks/use-theme";

import { CoreRuleText } from "./core-rule-text";

/** The bullets and examples printed under a rule. They are never folded into its body. */
function CoreRuleDetails({
  details,
  highlight,
}: {
  readonly details: readonly CoreRuleDetail[];
  readonly highlight: CoreRuleRowHighlight | null;
}) {
  if (details.length === 0) return null;

  return (
    <View style={styles.details}>
      {details.map((detail) =>
        match(detail)
          .with({ kind: "bullet" }, (bullet) => (
            <CoreRuleBullet
              body={bullet.body}
              highlight={highlight?.detailsByPosition.get(bullet.position) ?? null}
              key={bullet.position}
            />
          ))
          .with({ kind: "example" }, (example) => (
            <CoreRuleExample
              body={example.body}
              highlight={highlight?.detailsByPosition.get(example.position) ?? null}
              key={example.position}
            />
          ))
          .exhaustive(),
      )}
    </View>
  );
}

function CoreRuleBullet({
  body,
  highlight,
}: {
  readonly body: string;
  readonly highlight: CoreRuleHighlight | null;
}) {
  return (
    <View style={styles.bullet}>
      <ThemedText themeColor="textTertiary" type="body">
        ·
      </ThemedText>
      <View style={styles.bulletBody}>
        <CoreRuleText highlight={highlight} text={body} themeColor="textSecondary" type="body" />
      </View>
    </View>
  );
}

function CoreRuleExample({
  body,
  highlight,
}: {
  readonly body: string;
  readonly highlight: CoreRuleHighlight | null;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.example, { borderLeftColor: theme.border }]}>
      <ThemedText themeColor="textTertiary" type="mono">
        Example
      </ThemedText>
      <CoreRuleText highlight={highlight} text={body} themeColor="textSecondary" type="body" />
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
    minWidth: 0,
  },
  example: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    marginLeft: Spacing.three,
    paddingLeft: Spacing.two + Spacing.one,
  },
});
