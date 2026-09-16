import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { NotesGlyph } from "@/components/ui/icons/notes-glyph";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import { noteCountLabel } from "@/features/annotation/presentation/note-format";
import { useTheme } from "@/hooks/use-theme";

interface NotesControlProps {
  readonly count: number;
  /** Names the subject: a column of these is otherwise a stack of controls that all read alike. */
  readonly label: string;
  readonly onPress: () => void;
}

/**
 * Opens everything written on one subject, and says how much that is. The count is printed as well
 * as colored, so a subject that carries notes is not told apart by the highlight alone.
 */
function NotesControl({ count, label, onPress }: NotesControlProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityValue={{ text: noteCountLabel(count) }}
      onPress={onPress}
      style={({ pressed }) => [styles.control, pressed && styles.pressed]}
    >
      <NotesGlyph color={count === 0 ? theme.textTertiary : theme.highlight} />
      {count === 0 ? null : (
        <ThemedText style={styles.count} themeColor="highlight" type="code">
          {count}
        </ThemedText>
      )}
    </Pressable>
  );
}

export { NotesControl };
export type { NotesControlProps };

const styles = StyleSheet.create({
  control: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: Radius.small,
    gap: Spacing.half,
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
    paddingVertical: Spacing.one,
  },
  count: {
    lineHeight: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
