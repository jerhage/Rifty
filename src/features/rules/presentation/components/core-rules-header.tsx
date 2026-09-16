import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { match } from "ts-pattern";

import { SearchField } from "@/components/ui/atoms/search-field";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxReadingWidth, Spacing } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { ActiveCoreRuleHit, CoreRuleSearch } from "@/features/rules/core-rule-search";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import type { CoreRulesContentsPlacement } from "@/features/rules/presentation/core-rules-contents-placement";
import {
  coreRuleBookmarkCountLabel,
  coreRulesCountLabel,
  coreRulesEditionLabel,
} from "@/features/rules/presentation/core-rules-format";
import { useTheme } from "@/hooks/use-theme";

import { CoreRulesContentsControl } from "./contents/core-rules-contents-control";
import { CoreRuleMatchNavigation } from "./core-rule-match-navigation";

interface CoreRulesHeaderProps {
  readonly activeHit: ActiveCoreRuleHit;
  readonly bookmarkedCount: number;
  readonly contentsPlacement: CoreRulesContentsPlacement;
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
 * or what their query found, and beside it how much of it they have kept.
 */
function CoreRulesHeader({
  activeHit,
  bookmarkedCount,
  contentsPlacement,
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

  /**
   * The header's own line-up follows the page below it: against the leading edge where the page is
   * a spread, and inside the same capped column where the page is one column of prose.
   */
  const columnStyle = match(contentsPlacement)
    .with({ type: "beside" }, () => styles.spreadColumn)
    .with({ type: "over" }, () => styles.readingColumn)
    .exhaustive();

  return (
    <ThemedView style={[styles.header, { borderBottomColor: theme.border }]}>
      <View
        style={[
          columnStyle,
          {
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
            paddingTop: insets.top + Spacing.four,
          },
        ]}
      >
        <View style={styles.titleRow}>
          <View style={styles.title}>
            <ThemedText accessibilityRole="header" type="display">
              {edition.title}
            </ThemedText>
            <ThemedText themeColor="textSecondary" type="mono">
              {coreRulesEditionLabel(edition)}
            </ThemedText>
          </View>
          {match(contentsPlacement)
            .with({ type: "beside" }, () => null)
            .with({ type: "over" }, ({ open }) => <CoreRulesContentsControl onPress={open} />)
            .exhaustive()}
        </View>
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
        <View style={styles.counts}>
          <ThemedText themeColor="textTertiary" type="mono">
            {coreRulesCountLabel(coreRules, search)}
          </ThemedText>
          <ThemedText themeColor="textTertiary" type="mono">
            {coreRuleBookmarkCountLabel(bookmarkedCount)}
          </ThemedText>
        </View>
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
  readingColumn: {
    alignSelf: "center",
    gap: Spacing.two - 3,
    maxWidth: MaxReadingWidth,
    paddingBottom: Spacing.three,
    width: "100%",
  },
  spreadColumn: {
    gap: Spacing.two - 3,
    paddingBottom: Spacing.three,
    width: "100%",
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.three,
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    gap: Spacing.two - 3,
    minWidth: 0,
  },
  field: {
    marginTop: Spacing.two + 1,
  },
  counts: {
    flexDirection: "row",
    /** Two counts of scaling text in a phone's width: past about twice the default they wrap. */
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.two - 1,
  },
});
