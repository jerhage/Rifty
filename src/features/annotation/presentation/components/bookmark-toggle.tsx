import { Pressable, StyleSheet } from "react-native";

import { BookmarkGlyph } from "@/components/ui/icons/bookmark-glyph";
import { Radius, TouchTarget } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type BookmarkToggleAlignment = "center" | "start";

interface BookmarkToggleProps {
  readonly alignment?: BookmarkToggleAlignment;
  readonly bookmarked: boolean;
  /** Names the subject: a list of these is otherwise a column of controls that all read alike. */
  readonly label: string;
  readonly onPress: () => void;
}

/**
 * Two states rather than two acts, so it is a checkbox: it reports which state it is in, and a
 * reader is never told to press something to find out.
 */
function BookmarkToggle({ alignment = "center", bookmarked, label, onPress }: BookmarkToggleProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: bookmarked }}
      onPress={onPress}
      style={({ pressed }) => [styles.control, styles[alignment], pressed && styles.pressed]}
    >
      <BookmarkGlyph color={bookmarked ? theme.accent : theme.textTertiary} filled={bookmarked} />
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
