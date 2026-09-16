import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { BookmarkGlyph } from "@/components/ui/icons/bookmark-glyph";
import { ChevronGlyph } from "@/components/ui/icons/chevron-glyph";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { coreRuleBookmarkCountLabel } from "@/features/rules/presentation/core-rules-format";
import { useTheme } from "@/hooks/use-theme";

/** The design collapses the pane to 60 points and opens it to 352 or a third of the frame. */
const SAVED_PANE_COLLAPSED_WIDTH = 60;

const SAVED_PANE_WIDTH = 352;
const SAVED_PANE_MAX_SHARE = "32%";

/** The label is laid out along its length and then turned, so 60 points would wrap it first. */
const SAVED_LABEL_LENGTH = 132;
const SAVED_LABEL_THICKNESS = 16;

function coreRulesSavedLabelLength(fontScale: number): number {
  return Math.ceil(SAVED_LABEL_LENGTH * fontScale);
}

const SAVED_PANE_TITLE = "Saved rules";

interface CoreRulesSavedPaneProps {
  readonly bookmarkedCount: number;
  readonly children: ReactNode;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}

function CoreRulesSavedPane({
  bookmarkedCount,
  children,
  expanded,
  onToggle,
}: CoreRulesSavedPaneProps) {
  const theme = useTheme();

  if (!expanded) {
    return (
      <Pressable
        accessibilityLabel={SAVED_PANE_TITLE}
        accessibilityRole="button"
        accessibilityState={{ expanded: false }}
        accessibilityValue={{ text: coreRuleBookmarkCountLabel(bookmarkedCount) }}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.pane,
          styles.strip,
          { borderStartColor: theme.border },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.control, { backgroundColor: theme.fill, borderColor: theme.border }]}>
          <ChevronGlyph color={theme.textSecondary} direction="left" />
        </View>
        {/* The emblem of the pane rather than a state of it: the count beneath says what is kept. */}
        <BookmarkGlyph color={theme.accent} filled={false} />
        <ThemedText themeColor="accent" type="code">
          {bookmarkedCount}
        </ThemedText>
        <TurnedLabel />
      </Pressable>
    );
  }

  return (
    <View style={[styles.pane, styles.open, { borderStartColor: theme.border }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <ThemedText
          accessibilityRole="header"
          style={styles.headings}
          themeColor="textTertiary"
          type="mono"
        >
          {SAVED_PANE_TITLE}
        </ThemedText>
        <Pressable
          accessibilityLabel={SAVED_PANE_TITLE}
          accessibilityRole="button"
          accessibilityState={{ expanded: true }}
          onPress={onToggle}
          style={({ pressed }) => [styles.collapse, pressed && styles.pressed]}
        >
          <View
            style={[styles.control, { backgroundColor: theme.fill, borderColor: theme.border }]}
          >
            <ChevronGlyph color={theme.textSecondary} direction="right" />
          </View>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scrolled} style={styles.scroll}>
        {children}
      </ScrollView>
    </View>
  );
}

/** Turned after it is laid out, so the length it was given becomes its height. */
function TurnedLabel() {
  const { fontScale } = useWindowDimensions();
  const length = coreRulesSavedLabelLength(fontScale);

  return (
    <View style={[styles.labelSlot, { height: length }]}>
      <ThemedText
        numberOfLines={1}
        style={[styles.turned, { width: length }]}
        themeColor="textTertiary"
        type="mono"
      >
        Saved &amp; notes
      </ThemedText>
    </View>
  );
}

export {
  CoreRulesSavedPane,
  SAVED_PANE_COLLAPSED_WIDTH,
  SAVED_PANE_TITLE,
  SAVED_PANE_WIDTH,
  coreRulesSavedLabelLength,
};
export type { CoreRulesSavedPaneProps };

const styles = StyleSheet.create({
  pane: {
    borderStartWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
    flexShrink: 0,
    paddingTop: Spacing.two,
  },
  strip: {
    alignItems: "center",
    gap: Spacing.three - 2,
    paddingBottom: Spacing.four - 2,
    width: SAVED_PANE_COLLAPSED_WIDTH,
  },
  open: {
    maxWidth: SAVED_PANE_MAX_SHARE,
    width: SAVED_PANE_WIDTH,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two,
    paddingBottom: Spacing.two,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
  },
  headings: {
    flex: 1,
    minWidth: 0,
  },
  collapse: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
  },
  control: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  labelSlot: {
    alignItems: "center",
    justifyContent: "center",
    width: SAVED_LABEL_THICKNESS,
  },
  turned: {
    textAlign: "center",
    transform: [{ rotate: "90deg" }],
  },
  scroll: {
    flex: 1,
  },
  scrolled: {
    gap: Spacing.two + 1,
    paddingBottom: Spacing.five,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    paddingTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
