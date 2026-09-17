import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { match } from "ts-pattern";

import { BookmarkGlyph } from "@/components/ui/icons/bookmark-glyph";
import { SearchField } from "@/components/ui/atoms/search-field";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxReadingWidth, Radius, Spacing, TouchTarget } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { ActiveCoreRuleHit, CoreRuleSearch } from "@/features/rules/core-rule-search";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import type { CoreRulesContentsPlacement } from "@/features/rules/presentation/core-rules-contents-placement";
import {
  coreRuleBookmarkCountLabel,
  coreRuleSavedWash,
  coreRulesCountLabel,
  coreRulesEditionLabel,
} from "@/features/rules/presentation/core-rules-format";
import type { CoreRulesSavedPlacement } from "@/features/rules/presentation/core-rules-saved-placement";
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
  readonly savedPlacement: CoreRulesSavedPlacement;
  readonly search: CoreRuleSearch;
}

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
  savedPlacement,
  search,
}: CoreRulesHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  /** The header's line-up follows the page below it. */
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
            .with({ type: "beside" }, () => (
              <ThemedText style={styles.spreadCount} themeColor="textTertiary" type="mono">
                {coreRulesCountLabel(coreRules, search)}
              </ThemedText>
            ))
            .with({ type: "over" }, ({ open }) => (
              <View style={styles.controls}>
                <SavedControl count={bookmarkedCount} placement={savedPlacement} />
                <CoreRulesContentsControl onPress={open} />
              </View>
            ))
            .exhaustive()}
        </View>
        <SearchField
          accessibilityLabel="Search the core rules"
          hint="Search the rules text, e.g. recycle"
          onChangeQuery={onChangeQuery}
          query={query}
          style={styles.field}
        />
        {match(search)
          .with({ type: "noQuery" }, () => null)
          .with({ type: "searched" }, (searched) => (
            <CoreRuleMatchNavigation
              activeHit={activeHit}
              matchesOnly={matchesOnly}
              onStepToNextHit={onStepToNextHit}
              onStepToPreviousHit={onStepToPreviousHit}
              onToggleMatchesOnly={onToggleMatchesOnly}
              search={searched}
            />
          ))
          .exhaustive()}
        {match(contentsPlacement)
          .with({ type: "beside" }, () => null)
          .with({ type: "over" }, () => (
            <View style={styles.counts}>
              <ThemedText themeColor="textTertiary" type="mono">
                {coreRulesCountLabel(coreRules, search)}
              </ThemedText>
            </View>
          ))
          .exhaustive()}
      </View>
    </ThemedView>
  );
}

/** The count is also the way to what was kept, and on a tablet it says whether the pane is open. */
function SavedControl({
  count,
  placement,
}: {
  readonly count: number;
  readonly placement: CoreRulesSavedPlacement;
}) {
  const label = coreRuleBookmarkCountLabel(count);
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={match(placement)
        .with({ type: "beside" }, ({ expanded }) => ({ expanded }))
        .with({ type: "over" }, () => ({ expanded: false }))
        .exhaustive()}
      onPress={match(placement)
        .with({ type: "beside" }, ({ toggle }) => toggle)
        .with({ type: "over" }, ({ open }) => open)
        .exhaustive()}
      style={({ pressed }) => [
        styles.saved,
        {
          backgroundColor: coreRuleSavedWash(theme, "surface"),
          borderColor: coreRuleSavedWash(theme, "edge"),
        },
        pressed && styles.pressed,
      ]}
    >
      <BookmarkGlyph color={theme.accent} filled={count > 0} />
      <ThemedText themeColor="accent" type="mono">
        {String(count)}
      </ThemedText>
    </Pressable>
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
  spreadCount: {
    alignSelf: "flex-end",
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two - 2,
  },
  saved: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two - 3,
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
    paddingHorizontal: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  counts: {
    alignItems: "center",
    flexDirection: "row",
    /** Two counts of scaling text in a phone's width: past about twice the default they wrap. */
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.two - 1,
  },
});
