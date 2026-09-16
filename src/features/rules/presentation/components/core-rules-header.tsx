import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchField } from "@/components/ui/atoms/search-field";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxReadingWidth, Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { ActiveCoreRuleHit, CoreRuleSearch } from "@/features/rules/core-rule-search";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import {
  coreRulesCountLabel,
  coreRulesEditionLabel,
} from "@/features/rules/presentation/core-rules-format";
import { useTheme } from "@/hooks/use-theme";

import { CoreRuleMatchNavigation } from "./core-rule-match-navigation";

interface CoreRulesHeaderProps {
  readonly activeHit: ActiveCoreRuleHit;
  readonly coreRules: readonly CoreRule[];
  readonly edition: CoreRulesEdition;
  readonly matchesOnly: boolean;
  readonly onChangeQuery: (query: string) => void;
  readonly onStepToNextHit: () => void;
  readonly onStepToPreviousHit: () => void;
  readonly onToggleMatchesOnly: () => void;
  readonly query: string;
  readonly search: CoreRuleSearch;
}

/**
 * Names the edition on screen and stays put, so the document scrolls beneath rather than past it.
 * The count line under it answers whichever question the reader is asking: what the document holds,
 * or what their query found.
 */
function CoreRulesHeader({
  activeHit,
  coreRules,
  edition,
  matchesOnly,
  onChangeQuery,
  onStepToNextHit,
  onStepToPreviousHit,
  onToggleMatchesOnly,
  query,
  search,
}: CoreRulesHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView style={[styles.header, { borderBottomColor: theme.border }]}>
      <View
        style={[
          styles.column,
          {
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
            paddingTop: insets.top + Spacing.four,
          },
        ]}
      >
        <ThemedText accessibilityRole="header" type="display">
          {edition.title}
        </ThemedText>
        <ThemedText themeColor="textSecondary" type="mono">
          {coreRulesEditionLabel(edition)}
        </ThemedText>
        <SearchField
          accessibilityLabel="Search the core rules"
          hint="Search the rules text, e.g. recycle"
          onChangeQuery={onChangeQuery}
          query={query}
          style={styles.field}
        />
        {search.type === "searched" ? (
          <CoreRuleMatchNavigation
            activeHit={activeHit}
            matchesOnly={matchesOnly}
            onStepToNextHit={onStepToNextHit}
            onStepToPreviousHit={onStepToPreviousHit}
            onToggleMatchesOnly={onToggleMatchesOnly}
            search={search}
          />
        ) : null}
        <ThemedText style={styles.counts} themeColor="textTertiary" type="mono">
          {coreRulesCountLabel(coreRules, search)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

export { CoreRulesHeader };
export type { CoreRulesHeaderProps };

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  column: {
    alignSelf: "center",
    gap: Spacing.two - 3,
    maxWidth: MaxReadingWidth,
    paddingBottom: Spacing.three,
    width: "100%",
  },
  field: {
    marginTop: Spacing.two + 1,
  },
  counts: {
    marginTop: Spacing.two - 1,
  },
});
