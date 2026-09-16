import { StyleSheet, Text } from "react-native";
import { match } from "ts-pattern";

import { ThemedText, type ThemedTextType } from "@/components/ui/atoms/themed-text";
import type { ThemeColor } from "@/constants/theme";
import {
  coreRuleHighlightWash,
  coreRuleTextRuns,
  type CoreRuleHighlight,
  type CoreRuleTextRun,
} from "@/features/rules/presentation/core-rule-highlight";
import { useTheme } from "@/hooks/use-theme";

interface CoreRuleTextProps {
  /** Absent while nothing is searched, or while this text holds no occurrence of the query. */
  readonly highlight: CoreRuleHighlight | null;
  readonly text: string;
  readonly themeColor?: ThemeColor;
  readonly type: ThemedTextType;
}

/**
 * One piece of the document with the query marked inside it. The marks are nested runs of a single
 * text, which is how React Native draws a background behind part of a line.
 */
function CoreRuleText({ highlight, text, themeColor = "text", type }: CoreRuleTextProps) {
  if (highlight === null) {
    return (
      <ThemedText themeColor={themeColor} type={type}>
        {text}
      </ThemedText>
    );
  }

  return (
    <ThemedText themeColor={themeColor} type={type}>
      {coreRuleTextRuns(text, highlight).map((run) => (
        <CoreRuleTextRunText key={run.key} run={run} />
      ))}
    </ThemedText>
  );
}

function CoreRuleTextRunText({ run }: { readonly run: CoreRuleTextRun }) {
  const theme = useTheme();

  return match(run.kind)
    .with("plain", () => <Text>{run.text}</Text>)
    .with("hit", () => (
      <Text style={{ backgroundColor: coreRuleHighlightWash(theme, "occurrence") }}>
        {run.text}
      </Text>
    ))
    .with("activeHit", () => (
      <Text
        style={[styles.activeHit, { backgroundColor: theme.highlight, color: theme.onHighlight }]}
      >
        {run.text}
      </Text>
    ))
    .exhaustive();
}

export { CoreRuleText };
export type { CoreRuleTextProps };

const styles = StyleSheet.create({
  activeHit: {
    fontWeight: 700,
  },
});
