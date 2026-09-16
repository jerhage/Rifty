import { Pressable, StyleSheet } from "react-native";

import { BookmarkGlyph } from "@/components/ui/icons/bookmark-glyph";
import { Radius, TouchTarget } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface BookmarkToggleProps {
  readonly bookmarked: boolean;
  /** Names the subject: a list of these is otherwise a column of controls that all read alike. */
  readonly label: string;
  readonly onPress: () => void;
}

/**
 * Two states rather than two acts, so it is a checkbox: it reports which state it is in, and a
 * reader is never told to press something to find out.
 *
 * The mark draws at the top of its target rather than in the middle of it. The target is a finger
 * wide and a rule may be one line tall, so a centered mark hangs below the text it marks.
 */
function BookmarkToggle({ bookmarked, label, onPress }: BookmarkToggleProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: bookmarked }}
      onPress={onPress}
      style={({ pressed }) => [styles.control, pressed && styles.pressed]}
    >
      <BookmarkGlyph color={bookmarked ? theme.accent : theme.textTertiary} filled={bookmarked} />
    </Pressable>
  );
}

export { BookmarkToggle };
export type { BookmarkToggleProps };

const styles = StyleSheet.create({
  control: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: Radius.small,
    justifyContent: "flex-start",
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
  },
  pressed: {
    opacity: 0.7,
  },
});
