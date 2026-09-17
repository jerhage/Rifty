import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { BookmarkGlyph } from "@/components/ui/icons/bookmark-glyph";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type BookmarkToggleAlignment = "center" | "start";

const MARKED_CAPTION = "Bookmarked";
const UNMARKED_CAPTION = "Bookmark";

interface BookmarkToggleProps {
  readonly alignment?: BookmarkToggleAlignment;
  readonly bookmarked: boolean;
  readonly captioned?: boolean;
  /** Names the subject: a list of these is otherwise a column of controls that all read alike. */
  readonly label: string;
  readonly onPress: () => void;
}

/**
 * Two states rather than two acts, so it is a checkbox: it reports which state it is in, and a
 * reader is never told to press something to find out.
 */
function BookmarkToggle({
  alignment = "center",
  bookmarked,
  captioned = false,
  label,
  onPress,
}: BookmarkToggleProps) {
  const theme = useTheme();
  const pill = bookmarked
    ? { backgroundColor: theme.accent, borderColor: theme.accent }
    : { backgroundColor: theme.fill, borderColor: theme.border };
  const markColor = captioned
    ? bookmarked
      ? theme.onAccent
      : theme.textSecondary
    : bookmarked
      ? theme.accent
      : theme.textTertiary;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: bookmarked }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        styles[alignment],
        captioned && [styles.pill, pill],
        pressed && styles.pressed,
      ]}
    >
      <BookmarkGlyph color={markColor} filled={bookmarked} />
      {captioned ? (
        <ThemedText
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          themeColor={bookmarked ? "onAccent" : "textSecondary"}
          type="mono"
        >
          {bookmarked ? MARKED_CAPTION : UNMARKED_CAPTION}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

export { BookmarkToggle };
export type { BookmarkToggleAlignment, BookmarkToggleProps };

const styles = StyleSheet.create({
  control: {
    alignItems: "center",
    borderRadius: Radius.small,
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
  },
  pill: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two,
    justifyContent: "center",
    paddingHorizontal: Spacing.three - 2,
  },
  center: {
    alignSelf: "center",
    justifyContent: "center",
  },
  start: {
    alignSelf: "flex-start",
    justifyContent: "flex-start",
  },
  pressed: {
    opacity: 0.7,
  },
});
