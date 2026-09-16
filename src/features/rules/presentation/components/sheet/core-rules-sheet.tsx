import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import { BottomSheetShell } from "@/components/ui/atoms/bottom-sheet-shell";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import type { NoteManager } from "@/features/annotation/note-manager";
import type { CoreRule } from "@/features/rules/core-rule";
import {
  coreRuleBookmarkCountLabel,
  coreRuleSavedWash,
} from "@/features/rules/presentation/core-rules-format";
import type { CoreRulesSheetState } from "@/features/rules/presentation/core-rules-sheet-state";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";
import { useTheme } from "@/hooks/use-theme";

import { CoreRulesContentsList } from "../contents/core-rules-contents-list";
import { CoreRulesSavedList } from "../saved/core-rules-saved-list";

interface CoreRulesSheetProps {
  readonly bookmarkedNumbers: ReadonlySet<CoreRuleNumber>;
  readonly clock: Clock;
  readonly coreRules: readonly CoreRule[];
  readonly idGenerator: IdGenerator;
  readonly noteManager: NoteManager;
  readonly onDismiss: () => void;
  readonly onGoToCoreRule: (number: CoreRuleNumber) => void;
  readonly onRemoveBookmark: (number: CoreRuleNumber) => void;
  readonly onShowFace: (state: CoreRulesSheetState) => void;
  readonly state: CoreRulesSheetState;
}

/**
 * The two tabs name the sheet, so it carries no title, and neither list has anything to confirm, so
 * it ends at the body. The face is built only while the sheet is open: a document's worth of
 * entries and a read of every subject's notes must not stand behind a closed one.
 */
function CoreRulesSheet({
  bookmarkedNumbers,
  clock,
  coreRules,
  idGenerator,
  noteManager,
  onDismiss,
  onGoToCoreRule,
  onRemoveBookmark,
  onShowFace,
  state,
}: CoreRulesSheetProps) {
  return (
    <BottomSheetShell isPresented={state !== "hidden"} onDismiss={onDismiss}>
      {state === "hidden" ? (
        <View />
      ) : (
        <View style={styles.face}>
          <CoreRulesSheetHeader
            bookmarkedCount={bookmarkedNumbers.size}
            onDismiss={onDismiss}
            onShowFace={onShowFace}
            state={state}
          />
          <ScrollView contentContainerStyle={styles.body} style={styles.scroll}>
            {match(state)
              .with("contents", () => (
                <CoreRulesContentsList coreRules={coreRules} onSelectEntry={onGoToCoreRule} />
              ))
              .with("saved", () => (
                <CoreRulesSavedList
                  bookmarkedNumbers={bookmarkedNumbers}
                  clock={clock}
                  coreRules={coreRules}
                  idGenerator={idGenerator}
                  noteManager={noteManager}
                  onGoToCoreRule={onGoToCoreRule}
                  onRemoveBookmark={onRemoveBookmark}
                />
              ))
              .exhaustive()}
          </ScrollView>
        </View>
      )}
    </BottomSheetShell>
  );
}

function CoreRulesSheetHeader({
  bookmarkedCount,
  onDismiss,
  onShowFace,
  state,
}: {
  readonly bookmarkedCount: number;
  readonly onDismiss: () => void;
  readonly onShowFace: (state: CoreRulesSheetState) => void;
  readonly state: CoreRulesSheetState;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <View style={styles.tabs}>
        <CoreRulesSheetTab
          label="Contents"
          onPress={() => onShowFace("contents")}
          selected={state === "contents"}
        />
        <CoreRulesSheetTab
          accent
          count={bookmarkedCount}
          label="Saved"
          name={`Saved, ${coreRuleBookmarkCountLabel(bookmarkedCount)}`}
          onPress={() => onShowFace("saved")}
          selected={state === "saved"}
        />
      </View>
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        onPress={onDismiss}
        style={({ pressed }) => [styles.close, pressed && styles.pressed]}
      >
        <ThemedText themeColor="textSecondary" type="mono">
          Close
        </ThemedText>
      </Pressable>
    </View>
  );
}

/** Two pills rather than a track with a thumb, which is what the design draws. */
function CoreRulesSheetTab({
  accent = false,
  count,
  label,
  name,
  onPress,
  selected,
}: {
  readonly accent?: boolean;
  readonly count?: number;
  readonly label: string;
  readonly name?: string;
  readonly onPress: () => void;
  readonly selected: boolean;
}) {
  const theme = useTheme();
  const surface = selected
    ? {
        backgroundColor: accent ? coreRuleSavedWash(theme, "surface") : theme.fill,
        borderColor: accent ? coreRuleSavedWash(theme, "edge") : theme.border,
      }
    : { backgroundColor: "transparent", borderColor: "transparent" };

  return (
    <Pressable
      accessibilityLabel={name ?? label}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.tab, surface, pressed && styles.pressed]}
    >
      <ThemedText
        themeColor={selected ? (accent ? "accent" : "text") : "textSecondary"}
        type="mono"
      >
        {label}
      </ThemedText>
      {count === undefined ? null : (
        <ThemedText
          style={styles.count}
          themeColor={selected ? "accent" : "textTertiary"}
          type="mono"
        >
          {count}
        </ThemedText>
      )}
    </Pressable>
  );
}

export { CoreRulesSheet };
export type { CoreRulesSheetProps };

const styles = StyleSheet.create({
  face: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two + 2,
    paddingBottom: Spacing.two + 2,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.three - 4,
  },
  tabs: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two - 2,
    minWidth: 0,
  },
  tab: {
    alignItems: "center",
    borderRadius: Radius.medium - 2,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two - 1,
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    paddingHorizontal: Spacing.three - 3,
  },
  count: {
    opacity: 0.8,
  },
  close: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
  },
  scroll: {
    flexGrow: 1,
    height: 0,
  },
  body: {
    paddingBottom: Spacing.four + 2,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.two - 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
