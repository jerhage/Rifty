import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/atoms/empty-state";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxReadingWidth, Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import {
  coreRuleBarColor,
  type CoreRuleRowHighlight,
} from "@/features/rules/presentation/core-rule-highlight";
import { useCoreRulesSearch } from "@/features/rules/presentation/hooks/use-core-rules-search";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";
import { useTheme } from "@/hooks/use-theme";

import { CoreRuleRow } from "../components/core-rule-row";
import { CoreRulesHeader } from "../components/core-rules-header";

interface CoreRulesScreenProps {
  readonly coreRules: readonly CoreRule[];
  readonly edition: CoreRulesEdition;
}

/**
 * The whole document in printed order under a header that does not scroll. The reading column is
 * capped and centered, so a tablet gets one comfortable measure rather than a full-frame line.
 *
 * A query that finds nothing replaces the document rather than printing a note beneath it, because
 * a message at the far end of 1364 entries is a message nobody reads.
 */
function CoreRulesScreen({ coreRules, edition }: CoreRulesScreenProps) {
  const {
    activeHit,
    changeQuery,
    highlights,
    matchesOnly,
    query,
    search,
    shownCoreRules,
    stepToNextHit,
    stepToPreviousHit,
    toggleMatchesOnly,
  } = useCoreRulesSearch(coreRules);
  const foundNothing = search.type === "searched" && search.hitCount === 0;

  return (
    <ThemedView style={styles.screen}>
      <CoreRulesHeader
        activeHit={activeHit}
        coreRules={coreRules}
        edition={edition}
        matchesOnly={matchesOnly}
        onChangeQuery={changeQuery}
        onStepToNextHit={stepToNextHit}
        onStepToPreviousHit={stepToPreviousHit}
        onToggleMatchesOnly={toggleMatchesOnly}
        query={query}
        search={search}
      />
      {foundNothing ? (
        <CoreRulesNoMatches />
      ) : (
        <CoreRuleDocument coreRules={shownCoreRules} highlights={highlights} />
      )}
    </ThemedView>
  );
}

function CoreRuleDocument({
  coreRules,
  highlights,
}: {
  readonly coreRules: readonly CoreRule[];
  readonly highlights: ReadonlyMap<CoreRuleNumber, CoreRuleRowHighlight>;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <FlatList
      contentContainerStyle={[
        styles.column,
        {
          paddingBottom: insets.bottom + Spacing.five,
          paddingLeft: insets.left + Spacing.three,
          paddingRight: insets.right + Spacing.three,
        },
      ]}
      data={coreRules}
      extraData={highlights}
      keyExtractor={(coreRule) => coreRule.number}
      renderItem={({ item }) => (
        <CoreRuleRow
          barColor={coreRuleBarColor(theme, highlights.get(item.number) ?? null)}
          coreRule={item}
          highlight={highlights.get(item.number) ?? null}
        />
      )}
      style={styles.document}
    />
  );
}

function CoreRulesNoMatches() {
  return (
    <View style={styles.noMatches}>
      <EmptyState message="Nothing in the rules text matches that. Try a shorter term." />
    </View>
  );
}

export { CoreRulesScreen };
export type { CoreRulesScreenProps };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  document: {
    flex: 1,
  },
  column: {
    alignSelf: "center",
    maxWidth: MaxReadingWidth,
    paddingTop: Spacing.two,
    width: "100%",
  },
  noMatches: {
    alignSelf: "center",
    maxWidth: MaxReadingWidth,
    paddingHorizontal: Spacing.three,
    width: "100%",
  },
});
