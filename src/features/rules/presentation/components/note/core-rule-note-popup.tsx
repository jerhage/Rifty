import { useMemo, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { match } from "ts-pattern";

import { BottomSheetShell } from "@/components/ui/atoms/bottom-sheet-shell";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import {
  coreRuleNotesTitle,
  coreRuleSavedContextLabel,
} from "@/features/rules/presentation/core-rules-format";
import { nearestCoreRuleHeading } from "@/features/rules/presentation/core-rules-saved";
import { useLayoutSize } from "@/hooks/use-layout-size";
import { useTheme } from "@/hooks/use-theme";

/** Enough of the rule to write against without leaving the document to read it in full. */
const NOTED_RULE_LINES = 4;

const CLOSE_LABEL = "Done";
const DISMISS_LABEL = "Close the notes";

interface CoreRuleNotePopupProps {
  /** The rule whose notes are open, and `null` while none is. */
  readonly coreRule: CoreRule | null;
  readonly coreRules: readonly CoreRule[];
  readonly notes: ReactNode;
  readonly onDismiss: () => void;
}

/**
 * Where a rule is written about, over the document rather than inside the row. Nothing about it is
 * gated on the rule being marked: the two acts are stored apart and offered apart.
 */
function CoreRuleNotePopup({ coreRule, coreRules, notes, onDismiss }: CoreRuleNotePopupProps) {
  const { layoutClass } = useLayoutSize();

  return match(layoutClass)
    .with("phone", () => (
      <BottomSheetShell isPresented={coreRule !== null} onDismiss={onDismiss}>
        {coreRule === null ? (
          <View />
        ) : (
          <CoreRuleNoteFace
            coreRule={coreRule}
            coreRules={coreRules}
            notes={notes}
            onDismiss={onDismiss}
            style={styles.filling}
          />
        )}
      </BottomSheetShell>
    ))
    .with("tablet", () => (
      <Modal
        animationType="fade"
        onRequestClose={onDismiss}
        transparent
        visible={coreRule !== null}
      >
        {coreRule === null ? null : (
          <CenteredPopup onDismiss={onDismiss}>
            <CoreRuleNoteFace
              coreRule={coreRule}
              coreRules={coreRules}
              notes={notes}
              onDismiss={onDismiss}
              style={styles.fitting}
            />
          </CenteredPopup>
        )}
      </Modal>
    ))
    .exhaustive();
}

/** The scrim is a control of its own, so giving the popup up is not a gesture only. */
function CenteredPopup({
  children,
  onDismiss,
}: {
  readonly children: ReactNode;
  readonly onDismiss: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.centered}>
      <Pressable
        accessibilityLabel={DISMISS_LABEL}
        accessibilityRole="button"
        onPress={onDismiss}
        style={styles.scrim}
      />
      <View
        style={[styles.card, { backgroundColor: theme.backgroundSheet, borderColor: theme.border }]}
      >
        {children}
      </View>
    </View>
  );
}

function CoreRuleNoteFace({
  coreRule,
  coreRules,
  notes,
  onDismiss,
  style,
}: {
  readonly coreRule: CoreRule;
  readonly coreRules: readonly CoreRule[];
  readonly notes: ReactNode;
  readonly onDismiss: () => void;
  /** The sheet gives the face a height to fill; the card takes the height the face asks for. */
  readonly style: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const heading = useMemo(
    () => nearestCoreRuleHeading(coreRules, coreRule.number),
    [coreRule.number, coreRules],
  );

  return (
    <View style={style}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.head}>
          <ThemedText
            accessibilityRole="header"
            style={styles.title}
            themeColor="highlight"
            type="mono"
          >
            {coreRuleNotesTitle(coreRule.number)}
          </ThemedText>
          <Pressable
            accessibilityLabel={CLOSE_LABEL}
            accessibilityRole="button"
            onPress={onDismiss}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <ThemedText themeColor="textSecondary" type="mono">
              {CLOSE_LABEL}
            </ThemedText>
          </Pressable>
        </View>
        <ThemedText type="heading">{coreRuleSavedContextLabel(coreRule, heading)}</ThemedText>
        <ThemedText numberOfLines={NOTED_RULE_LINES} themeColor="textSecondary" type="body">
          {coreRule.body}
        </ThemedText>
      </View>
      <ScrollView contentContainerStyle={styles.body} style={styles.scroll}>
        {notes}
      </ScrollView>
    </View>
  );
}

export { CoreRuleNotePopup };
export type { CoreRuleNotePopupProps };

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: Spacing.four,
  },
  scrim: {
    backgroundColor: "rgba(5, 6, 10, 0.7)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  card: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    width: 560,
  },
  filling: {
    flex: 1,
  },
  fitting: {
    flexShrink: 1,
    minHeight: 0,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    paddingBottom: Spacing.two + 2,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.three - 4,
  },
  head: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two + 2,
    minWidth: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  close: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
  },
  scroll: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  body: {
    paddingBottom: Spacing.four + 2,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
